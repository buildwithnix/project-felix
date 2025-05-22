CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_email TEXT,
    product_identifier TEXT,
    status TEXT,
    next_billing_date DATE,
    primer_payment_method_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE subscriptions IS 'Stores customer subscription information for the MVP.';
COMMENT ON COLUMN subscriptions.subscription_id IS 'Unique identifier for the subscription.';
COMMENT ON COLUMN subscriptions.customer_email IS 'Email address of the customer.';
COMMENT ON COLUMN subscriptions.product_identifier IS 'Identifier of the product subscribed to.';
COMMENT ON COLUMN subscriptions.status IS 'Current status of the subscription (e.g., pending_initial, active, failed).';
COMMENT ON COLUMN subscriptions.next_billing_date IS 'Date of the next scheduled billing attempt.';
COMMENT ON COLUMN subscriptions.primer_payment_method_token IS 'Token representing the payment method in Primer.io.';
COMMENT ON COLUMN subscriptions.created_at IS 'Timestamp of when the subscription was created.';