"use client"

import Link from "next/link"
import { useEffect, useState, useCallback } from "react"
import clsx from "clsx"
import { ArrowUp, Menu } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { User } from "@supabase/supabase-js"
import { useUser } from "@/hooks/use-user"

// ----------------------------------------------------------------------
// Types & Config
// ----------------------------------------------------------------------

type NavLink = {
  label: string
  href: string
  description?: string
  items?: NavLink[]
}

const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Listings", href: "/listings" },
  { label: "Dashboard", href: "/dashboard" },
]

const SCROLL_THRESHOLD = 20

function useScrolled(threshold: number = SCROLL_THRESHOLD) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > threshold)

    handleScroll() // run once on mount
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [threshold])

  return scrolled
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
        L
      </div>
      <span className="text-lg font-semibold tracking-tight">Logo</span>
    </Link>
  )
}

function DesktopNavItem({ link }: { link: NavLink }) {
  const hasChildren = Array.isArray(link.items) && link.items.length > 0

  if (hasChildren) {
    return (
      <NavigationMenuItem>
        <NavigationMenuTrigger className="bg-transparent text-sm font-medium">
          {link.label}
        </NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul className="grid w-[300px] gap-1 p-3">
            {link.items!.map((subItem) => (
              <li key={subItem.href}>
                <NavigationMenuLink asChild>
                  <Link
                    href={subItem.href}
                    className="block rounded-md p-3 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <div className="font-medium">{subItem.label}</div>
                    {subItem.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{subItem.description}</p>
                    )}
                  </Link>
                </NavigationMenuLink>
              </li>
            ))}
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>
    )
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link
          href={link.href}
          className="inline-flex h-9 items-center px-3 text-sm font-medium hover:bg-secondary/50"
        >
          {link.label}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  )
}

function DesktopNav() {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-1">
        {NAV_LINKS.map((link) => (
          <DesktopNavItem key={link.href} link={link} />
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function AuthButtons() {
  return (
    <div className="hidden items-center gap-2 md:flex">
      <Button asChild variant="ghost" size="sm">
        <Link href="/login">Sign In</Link>
      </Button>
      <Button asChild size="sm" className="shadow-sm">
        <Link href="/register">Get Started</Link>
      </Button>
    </div>
  )
}

function AuthButtonsSkeleton() {
  return (
    <div className="hidden items-center gap-2 md:flex" aria-hidden="true">
      <Skeleton className="h-8 w-16 rounded-md" />
      <Skeleton className="h-8 w-24 rounded-md" />
    </div>
  )
}

function MobileAuthSkeleton() {
  return (
    <div className="flex flex-col gap-2 border-t pt-4" aria-hidden="true">
      <Skeleton className="h-9 w-full rounded-md" />
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  )
}

function MobileNav({ user, isLoading }: { user: User | null; isLoading: boolean }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation menu">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="flex flex-col gap-4 mt-4 p-4">
            <div className="flex items-center justify-between border-b pb-4">
              <Logo />
              <SheetClose asChild className="p-3"></SheetClose>
            </div>

            <nav className="flex flex-1 flex-col gap-1 py-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {isLoading ? (
              <MobileAuthSkeleton />
            ) : !user ? (
              <div className="flex flex-col gap-2 border-t pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login" onClick={() => setOpen(false)}>
                    Sign In
                  </Link>
                </Button>
                <Button asChild className="w-full">
                  <Link href="/register" onClick={() => setOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function ScrollToTopButton({ visible }: { visible: boolean }) {
  const handleClick = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <Button
      onClick={handleClick}
      size="icon"
      aria-label="Scroll to top"
      className={clsx(
        "fixed bottom-6 right-6 z-50 h-11 w-11 rounded-full shadow-lg transition-all duration-300",
        "hover:scale-110 hover:shadow-xl",
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <ArrowUp className="h-5 w-5" />
    </Button>
  )
}

export default function Header() {
  const scrolled = useScrolled()
  const { data, isLoading } = useUser()
  const user = data?.user ?? null

  return (
    <>
      <header
        className={clsx(
          "sticky top-0 inset-x-0 z-50 w-full transition-all duration-300",
          "supports-[backdrop-filter]:bg-background/70 backdrop-blur-lg",
          scrolled ? "border-b border-border/40 shadow-sm" : "border-b border-border/40"
        )}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
          <Logo />

          <div className="flex items-center gap-6">
            <DesktopNav />
            {isLoading ? <AuthButtonsSkeleton /> : !user ? <AuthButtons /> : null}
            <MobileNav user={user} isLoading={isLoading} />
          </div>
        </div>
      </header>

      <ScrollToTopButton visible={scrolled} />
    </>
  )
}