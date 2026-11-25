'use client'

import { useMemo, useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type Option = { value: string; label: string }

function normalize(value: string) {
  return value.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd')
}

export function SearchableSelectPicker({
  id,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  disabled = false,
}: {
  id: string
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder: string
  searchPlaceholder: string
  disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const selected = options.find((option) => option.value === value)
  const filtered = useMemo(() => {
    const needle = normalize(query.trim())
    return needle ? options.filter((option) => normalize(option.label).includes(needle)) : options
  }, [options, query])

  return <Popover open={open} onOpenChange={(next) => { setOpen(next); if (!next) setQuery('') }}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} disabled={disabled} className="mt-2 h-11 w-full justify-between gap-2 bg-white px-3 text-left font-normal shadow-sm hover:bg-slate-50">
        <span className={`truncate ${selected ? 'text-slate-900' : 'text-muted-foreground'}`}>{selected?.label || placeholder}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1">
      <Command shouldFilter={false}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={searchPlaceholder} />
        <CommandList className="max-h-[min(20rem,calc(100dvh-12rem))]">
          <CommandEmpty>Không tìm thấy kết quả phù hợp.</CommandEmpty>
          <CommandGroup heading={`${filtered.length} kết quả`}>
            {filtered.map((option) => <CommandItem key={option.value} value={option.value} onSelect={() => { onChange(option.value); setOpen(false); setQuery('') }}>
              <Check className={`mr-2 h-4 w-4 shrink-0 ${option.value === value ? 'text-orange-600 opacity-100' : 'opacity-0'}`} />
              <span className="truncate">{option.label}</span>
            </CommandItem>)}
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
}
