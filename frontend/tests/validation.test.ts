import { describe, expect, it } from "vitest";
import { loginSchema } from "~/schemas/auth";
import { customerFormSchema } from "~/schemas/customer";
import { orderFormSchema } from "~/schemas/order";
import { productFormSchema } from "~/schemas/product";
import { toFieldErrors, validateForm } from "~/utils/form";

describe("login form", () => {
  it("requires a valid email and a password", () => {
    expect(validateForm(loginSchema, { email: "", password: "" }).errors).toEqual({
      email: "Email is required",
      password: "Password is required",
    });
    expect(validateForm(loginSchema, { email: "not-an-email", password: "x" }).errors).toEqual({
      email: "Enter a valid email address",
    });
  });
});

describe("product form", () => {
  const validProduct = { product_code: "PRD016", name: "USB Microphone", price: "650000", stock: "10" };

  it("converts form strings into the API payload", () => {
    expect(validateForm(productFormSchema, { ...validProduct, price: "1.500.000" }).data).toEqual({
      product_code: "PRD016",
      name: "USB Microphone",
      price: "1500000",
      stock: 10,
    });
  });

  it.each([
    { price: "12.5,0", message: "Price must be a whole number of Rupiah" },
    { price: "0", message: "Price must be greater than 0" },
    { price: "", message: "Price must be a whole number of Rupiah" },
  ])("rejects price '$price'", ({ price, message }) => {
    expect(validateForm(productFormSchema, { ...validProduct, price }).errors).toEqual({ price: message });
  });

  it("rejects negative or decimal stock and empty names", () => {
    expect(validateForm(productFormSchema, { ...validProduct, name: " ", stock: "-1" }).errors).toEqual({
      name: "Name is required",
      stock: "Stock must be a whole number (0 or more)",
    });
  });
});

describe("customer form", () => {
  it("allows optional fields to be empty", () => {
    const result = validateForm(customerFormSchema, { name: "Andi", email: "", phone: "", address: "" });
    expect(result.errors).toBeNull();
  });

  it("rejects an invalid email and phone", () => {
    expect(
      validateForm(customerFormSchema, { name: "Andi", email: "andi@", phone: "abc", address: "" }).errors,
    ).toEqual({
      email: "Enter a valid email address",
      phone: "Use digits, spaces, dashes and an optional leading +",
    });
  });
});

describe("order form", () => {
  it("requires a customer and at least one product", () => {
    expect(validateForm(orderFormSchema, { customer_id: null, items: [] }).errors).toEqual({
      customer_id: "Select a customer",
      items: "Add at least one product",
    });
  });

  it("requires a selected product and a positive whole quantity on each line", () => {
    const { errors } = validateForm(orderFormSchema, {
      customer_id: 1,
      items: [
        { product_id: null, quantity: 1 },
        { product_id: 2, quantity: 0 },
        { product_id: 3, quantity: 1.5 },
      ],
    });

    expect(errors).toEqual({
      "items.0.product_id": "Select a product",
      "items.1.quantity": "Quantity must be at least 1",
      "items.2.quantity": "Quantity must be a whole number",
    });
  });

  it("rejects the same product twice", () => {
    const { errors } = validateForm(orderFormSchema, {
      customer_id: 1,
      items: [
        { product_id: 2, quantity: 1 },
        { product_id: 2, quantity: 3 },
      ],
    });

    expect(errors).toEqual({ "items.1.product_id": "This product is already in the order" });
  });
});

describe("toFieldErrors", () => {
  it("keeps the first backend message per field, using the same keys as the form", () => {
    expect(
      toFieldErrors([
        { field: "items.1.quantity", message: "Insufficient stock for CBL-001 (available: 2)" },
        { field: "items.1.quantity", message: "second message" },
      ]),
    ).toEqual({ "items.1.quantity": "Insufficient stock for CBL-001 (available: 2)" });
  });
});
