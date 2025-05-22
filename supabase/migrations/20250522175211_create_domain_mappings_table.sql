CREATE TABLE domain_mappings (
    domain_name TEXT PRIMARY KEY,
    product_identifier_sanity TEXT
);

COMMENT ON TABLE domain_mappings IS 'Links incoming domains to Sanity product data.';
COMMENT ON COLUMN domain_mappings.domain_name IS 'The domain name (e.g., example.com).';
COMMENT ON COLUMN domain_mappings.product_identifier_sanity IS 'The corresponding product identifier from Sanity.io.';