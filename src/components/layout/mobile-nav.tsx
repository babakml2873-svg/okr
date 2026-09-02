'use client'

import { Menu, Target, X } from 'lucide-react'
import { useState } from 'react'

import { Button } from '../ui/button'
import { SidebarNav } from './sidebar'

/** Slide-over navigation for narrow screens. */
export function MobileNav({ organizationName }: { organizationName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setOpen(true)}
        aria-label="باز کردن منو"
      >
        <Menu className="size-5" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="بستن منو"
          />
          <div className="bg-sidebar absolute inset-y-0 end-0 flex w-72 flex-col shadow-xl">
            <div className="border-sidebar-border flex h-14 items-center justify-between border-b px-4">
              <span className="flex items-center gap-2.5">
                <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
                  <Target className="size-4" />
                </span>
                <span className="truncate text-sm font-semibold">{organizationName}</span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setOpen(false)}
                aria-label="بستن"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
