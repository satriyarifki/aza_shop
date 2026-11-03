CREATE TABLE "invoice_sequences" (
	"invoice_date" date PRIMARY KEY NOT NULL,
	"last_number" integer NOT NULL,
	CONSTRAINT "invoice_sequences_last_number_positive" CHECK ("invoice_sequences"."last_number" > 0)
);
