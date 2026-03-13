"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface NavProps {
  user: { name: string; isAdmin: boolean } | null
  onLogout: () => void
}

const navLinks = [
  { href: "/", label: "홈(랭킹)" },
  { href: "/team-records", label: "팀 기록" },
  { href: "/my-records", label: "내 기록" },
]

export function GlobalNav({ user, onLogout }: NavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-[#1a4d3e] text-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <span role="img" aria-label="running">{"🏃"}</span>
          <span>러닝 클럽</span>
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            {navLinks.map((link) => (
              <NavigationMenuItem key={link.href}>
                <Link href={link.href} legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    {link.label}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Right Section */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              {user.isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10 hover:text-white"
                  >
                    관리자
                  </Button>
                </Link>
              )}
              <span className="text-sm font-medium">{user.name}</span>
              <Button
                variant="outline"
                onClick={onLogout}
                className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                로그아웃
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button
                  variant="ghost"
                  className="text-white hover:bg-white/10 hover:text-white"
                >
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="bg-white text-[#1a4d3e] hover:bg-white/90">
                  회원가입
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-72 border-l-[#1a4d3e]/20 bg-[#1a4d3e] text-white"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-white">
                <span role="img" aria-label="running">{"🏃"}</span>
                <span>러닝 클럽</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-white/10"
                >
                  관리자
                </Link>
              )}
            </nav>
            <div className="mt-8 border-t border-white/20 pt-6">
              {user ? (
                <div className="flex flex-col gap-3">
                  <span className="px-3 text-sm font-medium">{user.name}</span>
                  <Button
                    variant="outline"
                    onClick={() => {
                      onLogout()
                      setIsOpen(false)
                    }}
                    className="w-full border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/login" onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full text-white hover:bg-white/10 hover:text-white"
                    >
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-white text-[#1a4d3e] hover:bg-white/90">
                      회원가입
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
