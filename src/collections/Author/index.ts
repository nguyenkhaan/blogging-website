import { CollectionConfig } from 'payload'
import { testingHook } from './hooks/creatingHook'

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
    timestamps: true, 
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
            name: 'themeColor', 
            label: 'Profile Color', 
            type: 'text', 
            required: true, 
            admin: {
                components: {
                    Field: 'src/collections/Author/components/ColorPicker.tsx'
                }
            }
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
    hooks: {
        beforeChange: [testingHook], 
        afterRead : [], 
        beforeDelete: [], 
        afterDelete: [] 
    }
}
