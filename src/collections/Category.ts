import { CollectionConfig } from "payload";

export const Category : CollectionConfig = {
    slug: 'category', 
    timestamps: true, 
    admin: {
        useAsTitle: 'name', 
        defaultColumns: ['name']
    }, 
    fields: [
        {
            name: 'name', 
            type: 'text', 
            required: true, 
            label: 'Category'  //Danh muc bai vie 
        }
    ]
}