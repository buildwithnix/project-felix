import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'productName',
      title: 'Product Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'productIdentifier',
      title: 'Product Identifier',
      type: 'slug',
      description: 'Used for domain mapping and internal lookups. Should be unique.',
      options: {
        source: 'productName',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroImageURL',
      title: 'Hero Image URL',
      type: 'url',
      description: 'URL for the main product image.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'initialChargeAmount',
      title: 'Initial Charge Amount',
      type: 'number',
      description: 'The amount for the initial charge (e.g., shipping). Stored as decimal.',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'recurringChargeAmount',
      title: 'Recurring Charge Amount',
      type: 'number',
      description: 'The amount for recurring charges. Stored as decimal.',
      validation: (Rule) => Rule.required().positive(),
    }),
    defineField({
      name: 'recurringIntervalDays',
      title: 'Recurring Interval (Days)',
      type: 'number',
      description: 'The interval in days for recurring charges.',
      validation: (Rule) => Rule.required().positive().integer(),
    }),
  ],
})