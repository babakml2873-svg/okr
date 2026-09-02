'use client'

import { Plus } from 'lucide-react'
import { useState } from 'react'

import { ObjectiveForm, type ObjectiveFormOptions } from '@/components/okr/objective-form'
import { Button } from '@/components/ui/button'

/**
 * Owns the "new objective" dialog. Kept as a thin client island so the
 * objectives list itself stays a server component.
 */
export function NewObjectiveButton({
  options,
  defaultQuarterId,
  defaultOpen = false,
  label = 'هدف جدید',
}: {
  options: ObjectiveFormOptions
  defaultQuarterId?: string
  defaultOpen?: boolean
  label?: string
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {label}
      </Button>
      {open && (
        <ObjectiveForm
          open={open}
          onOpenChange={setOpen}
          options={options}
          initialValues={defaultQuarterId ? { quarterId: defaultQuarterId } : undefined}
        />
      )}
    </>
  )
}
