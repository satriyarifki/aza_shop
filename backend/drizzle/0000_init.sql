CREATE TYPE "public"."user_role" AS ENUM('ADMIN');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'PAID', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "users" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"email" varchar(150) NOT NULL,
	"password" varchar(255) NOT NULL,
	"role" "user_role" DEFAULT 'ADMIN' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_code" varchar(50) NOT NULL,
	"name" varchar(150) NOT NULL,
	"price" bigint NOT NULL,
	"stock" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "products_product_code_unique" UNIQUE("product_code"),
	CONSTRAINT "products_price_positive" CHECK ("products"."price" > 0),
	CONSTRAINT "products_stock_non_negative" CHECK ("products"."stock" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(150) NOT NULL,
	"email" varchar(150),
	"phone" varchar(30),
	"address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_number" varchar(30) NOT NULL,
	"customer_id" bigint NOT NULL,
	"user_id" bigint NOT NULL,
	"subtotal" bigint NOT NULL,
	"discount_amount" bigint DEFAULT 0 NOT NULL,
	"grand_total" bigint NOT NULL,
	"status" "order_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "orders_subtotal_non_negative" CHECK ("orders"."subtotal" >= 0),
	CONSTRAINT "orders_discount_non_negative" CHECK ("orders"."discount_amount" >= 0),
	CONSTRAINT "orders_discount_within_subtotal" CHECK ("orders"."discount_amount" <= "orders"."subtotal"),
	CONSTRAINT "orders_discount_max" CHECK ("orders"."discount_amount" <= 150000),
	CONSTRAINT "orders_grand_total_non_negative" CHECK ("orders"."grand_total" >= 0),
	CONSTRAINT "orders_grand_total_matches" CHECK ("orders"."grand_total" = "orders"."subtotal" - "orders"."discount_amount")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_id" bigint NOT NULL,
	"product_id" bigint NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" bigint NOT NULL,
	"subtotal" bigint NOT NULL,
	CONSTRAINT "order_items_order_product_unique" UNIQUE("order_id","product_id"),
	CONSTRAINT "order_items_quantity_positive" CHECK ("order_items"."quantity" > 0),
	CONSTRAINT "order_items_unit_price_positive" CHECK ("order_items"."unit_price" > 0),
	CONSTRAINT "order_items_subtotal_non_negative" CHECK ("order_items"."subtotal" >= 0),
	CONSTRAINT "order_items_subtotal_matches" CHECK ("order_items"."subtotal" = "order_items"."unit_price" * "order_items"."quantity")
);
--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "orders_customer_id_idx" ON "orders" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "orders_user_id_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_status_idx" ON "orders" USING btree ("status");--> statement-breakpoint
CREATE INDEX "orders_created_at_idx" ON "orders" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "order_items_product_id_idx" ON "order_items" USING btree ("product_id");