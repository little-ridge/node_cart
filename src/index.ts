import type { SpruceNodeApp, SpruceNodeModule } from '../../node_core/src/types.ts';

export const name = '@little-ridge/node_cart';

export async function register(app: SpruceNodeApp): Promise<void> {
  app.rooms.allow(/^cart:[a-f0-9]{32}$/, 'cart');
  app.rooms.allow(/^user:\d+$/, 'cart');

  app.webhooks.on('cart/updated', (payload, live) => {
    const itemCount = asCount(payload.item_count ?? payload.itemCount);
    const userId = asPositiveInt(payload.user_id ?? payload.userId);
    const channel = asChannel(payload.channel);

    if (itemCount === undefined || (userId === 0 && channel === '')) {
      live.http.log.warn({ payload }, 'ignored cart/updated webhook');
      return;
    }

    const rooms: string[] = [];
    if (channel !== '') {
      rooms.push(`cart:${channel}`);
    }
    if (userId > 0) {
      rooms.push(`user:${userId}`);
    }

    const eventPayload: { itemCount: number; userId?: number; channel?: string } = {
      itemCount,
    };
    if (userId > 0) {
      eventPayload.userId = userId;
    }
    if (channel !== '') {
      eventPayload.channel = channel;
    }

    live.hub.broadcast(rooms, {
      type: 'event',
      event: 'cart.updated',
      rooms,
      payload: eventPayload,
    });
  });
}

export default {
  name,
  register,
} satisfies SpruceNodeModule;

function asCount(value: unknown): number | undefined {
  if (value == null || value === '') {
    return undefined;
  }
  const n = typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : undefined;
}

function asPositiveInt(value: unknown): number {
  const n = typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function asChannel(value: unknown): string {
  const raw = String(value ?? '').trim();
  return /^[a-f0-9]{32}$/.test(raw) ? raw : '';
}
