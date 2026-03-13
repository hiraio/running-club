"use client"

import { useState } from "react"
import { GlobalNav } from "@/components/global-nav"
import { Button } from "@/components/ui/button"

export default function Home() {
  const [user, setUser] = useState<{ name: string; isAdmin: boolean } | null>(
    null
  )

  const handleLogout = () => {
    setUser(null)
  }

  const simulateLogin = (isAdmin: boolean) => {
    setUser({
      name: isAdmin ? "관리자" : "홍길동",
      isAdmin,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <GlobalNav user={user} onLogout={handleLogout} />

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-lg border bg-card p-8">
          <h1 className="mb-6 text-2xl font-bold text-foreground">
            네비게이션 데모
          </h1>
          <p className="mb-6 text-muted-foreground">
            아래 버튼을 눌러 로그인 상태를 변경해보세요.
          </p>

          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => simulateLogin(false)}
              variant={user && !user.isAdmin ? "default" : "outline"}
            >
              일반 사용자로 로그인
            </Button>
            <Button
              onClick={() => simulateLogin(true)}
              variant={user?.isAdmin ? "default" : "outline"}
            >
              관리자로 로그인
            </Button>
            <Button
              onClick={handleLogout}
              variant={!user ? "default" : "outline"}
            >
              로그아웃 상태
            </Button>
          </div>

          <div className="mt-8 rounded-md bg-muted p-4">
            <h2 className="mb-2 font-semibold">현재 상태:</h2>
            {user ? (
              <div className="text-sm text-muted-foreground">
                <p>
                  사용자명: <span className="font-medium">{user.name}</span>
                </p>
                <p>
                  관리자:{" "}
                  <span className="font-medium">
                    {user.isAdmin ? "예" : "아니오"}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">비로그인 상태</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
