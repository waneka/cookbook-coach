'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'

export function RecipeSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [searchValue, setSearchValue] = useState(searchParams.get('search') || '')

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams)

    if (searchValue) {
      params.set('search', searchValue)
    } else {
      params.delete('search')
    }

    startTransition(() => {
      router.push(`/recipes?${params.toString()}`)
    })
  }

  const handleClear = () => {
    setSearchValue('')
    const params = new URLSearchParams(searchParams)
    params.delete('search')

    startTransition(() => {
      router.push(`/recipes?${params.toString()}`)
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search recipes..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          className="pl-9 pr-9"
          disabled={isPending}
        />
        {searchValue && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8"
            onClick={handleClear}
            disabled={isPending}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Button onClick={handleSearch} disabled={isPending || !searchValue}>
        Search
      </Button>
    </div>
  )
}
