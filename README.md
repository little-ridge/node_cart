# node_cart

Cart badge fan-out for the Little Ridge Node host. WordPress (`spruce_cart`) stores the cart. After a change, WordPress posts a signed webhook here and this module tells the matching browser to update its count.

## Rooms

- `cart:{channel}` — a guest cart. The channel is a public id, not the cookie secret. It only carries the item count.
- `user:{id}` — a logged-in cart. The browser sends a Spruce Node JWT before subscribing.

## Webhook

`POST /webhooks/cart/updated`

```
X-Webhook-Signature: sha256=<hmac of raw JSON>
X-Webhook-Event: cart.updated
X-Spruce-Origin: http://dw.local
```

```json
{
  "item_count": 2,
  "user_id": 7,
  "channel": ""
}
```

`user_id` and `channel` are optional, but at least one must be set. Both are set when a guest cart has just been claimed, so the old guest room and the user room receive the new count.
