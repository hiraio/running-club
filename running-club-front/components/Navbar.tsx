"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, Trophy, ClipboardList, LayoutDashboard, LogIn, LogOut } from "lucide-react";

interface NavbarProps {
  isLoggedIn?: boolean;
  onLogin?: () => void;
  onLogout?: () => void;
}

const navLinks = [
  { href: "/ranking", label: "랭킹", icon: Trophy },
  { href: "/records", label: "내 기록", icon: ClipboardList },
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
];

export function Navbar({ isLoggedIn = false, onLogin, onLogout }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 text-lg font-bold text-foreground transition-colors hover:text-primary"
        >
          <span className="text-xl">🏃</span>
          <span className="hidden sm:inline">Running Club</span>
        </Link>

        {/* Center: Desktop Navigation */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-primary">
                  <Icon className="size-4" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </div>

        {/* Right: Auth Button (Desktop) */}
        <div className="hidden items-center gap-2 md:flex">
          {isLoggedIn ? (
            <Button
              variant="outline"
              className="gap-2 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
              onClick={onLogout}
            >
              <LogOut className="size-4" />
              로그아웃
            </Button>
          ) : (
            <Button
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={onLogin}
            >
              <LogIn className="size-4" />
              로그인
            </Button>
          )}
        </div>

        {/* Mobile: Hamburger Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="size-5" />
              <span className="sr-only">메뉴 열기</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-left">
                <span className="text-xl">🏃</span>
                Running Club
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 text-muted-foreground hover:text-primary"
                    >
                      <Icon className="size-5" />
                      {link.label}
                    </Button>
                  </Link>
                );
              })}
              <div className="my-4 h-px bg-border" />
              {isLoggedIn ? (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => {
                    onLogout?.();
                    setIsOpen(false);
                  }}
                >
                  <LogOut className="size-5" />
                  로그아웃
                </Button>
              ) : (
                <Button
                  className="w-full justify-start gap-3 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => {
                    onLogin?.();
                    setIsOpen(false);
                  }}
                >
                  <LogIn className="size-5" />
                  로그인
                </Button>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
