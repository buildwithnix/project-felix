-- Insert a test domain mapping for localhost:3001
INSERT INTO domain_mappings (domain_name, product_identifier_sanity)
VALUES ('localhost:3001', 'test-product');

-- Note: This is test data for local development.
-- In a production environment, you would need to add actual domain mappings.
-- For example:
-- INSERT INTO domain_mappings (domain_name, product_identifier_sanity)
-- VALUES ('product1.example.com', 'product-1');