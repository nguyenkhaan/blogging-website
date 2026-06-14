'use client'

import { useField } from '@payloadcms/ui'

export default function ColorPicker({
    path,
}: {
    path: string
}) {
    const { value, setValue } = useField<string>({
        path,   //u dung useField de co the tien hanh lay data va nap vao ben trong cho Collection
    })

    return (
        <div>
            <label>Theme Color</label>

            <input
                type="color"
                value={value || '#3B82F6'}
                onChange={(e) => {
                    setValue(e.target.value)
                }}
            />
        </div>
    )
}