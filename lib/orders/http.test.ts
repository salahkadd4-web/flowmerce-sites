import { checkOrderRequest } from "@/lib/orders/http";

const ok = { host: "boutique.localhost:3100", origin: "http://boutique.localhost:3100", contentType: "application/json" };

it("accepte une requête JSON venue du site lui-même", () => {
  expect(checkOrderRequest(ok)).toBeNull();
  expect(checkOrderRequest({ ...ok, contentType: "application/json; charset=utf-8" })).toBeNull();
  expect(checkOrderRequest({ ...ok, host: "BOUTIQUE.localhost:3100" })).toBeNull();
});

it("refuse une requête venue d'un autre site", () => {
  expect(checkOrderRequest({ ...ok, origin: "http://evil.localhost:3100" })).not.toBeNull();
  expect(checkOrderRequest({ ...ok, origin: "null" })).not.toBeNull();
});

it("refuse une requête sans origine ou sans hôte", () => {
  expect(checkOrderRequest({ ...ok, origin: null })).not.toBeNull();
  expect(checkOrderRequest({ ...ok, host: null })).not.toBeNull();
});

it("refuse un corps qui n'est pas du JSON (formulaire posté depuis ailleurs)", () => {
  expect(checkOrderRequest({ ...ok, contentType: "text/plain" })).not.toBeNull();
  expect(checkOrderRequest({ ...ok, contentType: "application/x-www-form-urlencoded" })).not.toBeNull();
  expect(checkOrderRequest({ ...ok, contentType: null })).not.toBeNull();
});
