import { CollectionConfig } from 'payload'
const socialPlatformSelection = [
    {
        value: 'facebook', 
        label: 'Facebook'
    }, 
    {
        value: 'gmail', 
        label: 'Gmail'
    }, 
    {
        value: 'youtube', 
        label: 'Youtube'
    }
]
export const Author: CollectionConfig = {
    slug: 'author',
    admin: {},
    fields: [
        {
            name: 'name',
            label: 'Name',
            required: true,
            type: 'text',
        },
        {
            name: 'avatar',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'contacts', 
            label: 'Contact Information', 
            required: true, 
            type: 'array', 
            fields: [
                {
                    name: 'contactPlatform', 
                    label: 'Platform', 
                    type: 'select', 
                    options: socialPlatformSelection
                }, 
                {
                    name: 'url', 
                    label: 'Url', 
                    type: 'text', 
                    required: true 
                }
            ]
        }
    ],
}
