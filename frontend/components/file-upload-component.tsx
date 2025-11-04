import React from 'react'
import { Dropzone, DropzoneContent, DropzoneEmptyState } from './ui/shadcn-io/dropzone'

export default function FileUpload() {
  return (
    <div>
      <Dropzone>
        <DropzoneContent/>
        <DropzoneEmptyState/>
      </Dropzone>
    </div>
  )
}
