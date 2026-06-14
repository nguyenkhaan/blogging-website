import { CollectionConfig } from "payload";

export const Post : CollectionConfig = {
    slug: 'post', 
    admin: {
        useAsTitle: 'title', //No se day truong title len dau de hien thi
    }, 
    timestamps: true, //Tu dong quan ly them updatedAt, createdAt 
    fields: [
        {
            name: 'title', 
            type: 'text', 
            label: 'Blog Title', 
            required: true 
        }, 
        {
            name: 'content', 
            label: 'Blog Content', 
            type: 'richText', 
            required: true 
        }, 
        {
            name: 'status', 
            label: 'Status', 
            type: 'select', 
            options: [
                {
                    value: 'approved', 
                    label: 'Approve'
                }, 
                {
                    value: 'reject', 
                    label: 'Reject' 
                }
            ]
        }, 
        {
            name: 'banner', 
            label: 'Blog Banner', 
            type: 'upload', 
            required: true, 
            relationTo: 'media', 
        }, 
        {
            name: 'category', 
            type: 'relationship', 
            hasMany: false, 
            relationTo: 'category', 
            required: true //Mot bai blog chi duoc phep chon toi da 1 category 
        }, 
        {
            name: 'author', 
            type: 'relationship', 
            required: true, 
            relationTo: 'users', 
            hasMany: false //Mot bai post thi chi duoc phep co 1 tac gia 
        }
    ]
}