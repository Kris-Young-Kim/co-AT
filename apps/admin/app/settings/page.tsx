import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Bell, Shield, Database, MessageSquare } from "lucide-react"
import { RegulationEmbedButton } from "@/components/features/chat/RegulationEmbedButton"

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-responsive-xl font-bold text-foreground mb-2">
          ?¤ì •
        </h1>
        <p className="text-muted-foreground">
          ?œìŠ¤???¤ì • ë°??˜ê²½ êµ¬ì„±??ê´€ë¦¬í•  ???ˆìŠµ?ˆë‹¤
        </p>
      </div>

      <div className="space-y-6">
        {/* ?„ë¡œ???¤ì • */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <CardTitle>?„ë¡œ???¤ì •</CardTitle>
            </div>
            <CardDescription>
              ?¬ìš©???„ë¡œ???•ë³´ë¥?ê´€ë¦¬í•©?ˆë‹¤
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">?´ë¦„</Label>
              <Input id="name" placeholder="?´ë¦„???…ë ¥?˜ì„¸?? />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">?´ë©”??/Label>
              <Input id="email" type="email" placeholder="?´ë©”?¼ì„ ?…ë ¥?˜ì„¸?? />
            </div>
            <Button>?€??/Button>
          </CardContent>
        </Card>

        {/* ?Œë¦¼ ?¤ì • */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <CardTitle>?Œë¦¼ ?¤ì •</CardTitle>
            </div>
            <CardDescription>
              ?Œë¦¼ ?˜ì‹  ë°©ì‹???¤ì •?©ë‹ˆ??            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>?´ë©”???Œë¦¼</Label>
                <p className="text-sm text-muted-foreground">
                  ?´ë©”?¼ë¡œ ?Œë¦¼??ë°›ìŠµ?ˆë‹¤
                </p>
              </div>
              <Button variant="outline" size="sm">
                ?œì„±??              </Button>
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>?¸ì‹œ ?Œë¦¼</Label>
                <p className="text-sm text-muted-foreground">
                  ë¸Œë¼?°ì? ?¸ì‹œ ?Œë¦¼??ë°›ìŠµ?ˆë‹¤
                </p>
              </div>
              <Button variant="outline" size="sm">
                ë¹„í™œ?±í™”
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ë³´ì•ˆ ?¤ì • */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle>ë³´ì•ˆ ?¤ì •</CardTitle>
            </div>
            <CardDescription>
              ê³„ì • ë³´ì•ˆ??ê´€ë¦¬í•©?ˆë‹¤
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">?„ì¬ ë¹„ë?ë²ˆí˜¸</Label>
              <Input id="current-password" type="password" placeholder="?„ì¬ ë¹„ë?ë²ˆí˜¸" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">??ë¹„ë?ë²ˆí˜¸</Label>
              <Input id="new-password" type="password" placeholder="??ë¹„ë?ë²ˆí˜¸" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">ë¹„ë?ë²ˆí˜¸ ?•ì¸</Label>
              <Input id="confirm-password" type="password" placeholder="ë¹„ë?ë²ˆí˜¸ ?•ì¸" />
            </div>
            <Button>ë¹„ë?ë²ˆí˜¸ ë³€ê²?/Button>
          </CardContent>
        </Card>

        {/* ê·œì • ì±—ë´‡ ?°ì´??*/}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle>ê·œì • ì±—ë´‡ ?°ì´??/CardTitle>
            </div>
            <CardDescription>
              ë³´ì¡°ê¸°ê¸°?¼í„° ?´ì˜ ì§€ì¹¨ì„œë¥?ë²¡í„°?”í•˜??ì±—ë´‡??ê²€?‰í•  ???ˆê²Œ ?©ë‹ˆ??
              ì±—ë´‡?ì„œ &quot;?€?¥ëœ ê·œì •???†ìŠµ?ˆë‹¤&quot;ê°€ ?¨ë©´ ?„ë˜ ë²„íŠ¼???¤í–‰?˜ì„¸??
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegulationEmbedButton />
          </CardContent>
        </Card>

        {/* ?œìŠ¤???•ë³´ */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <CardTitle>?œìŠ¤???•ë³´</CardTitle>
            </div>
            <CardDescription>
              ?œìŠ¤???íƒœ ë°?ë²„ì „ ?•ë³´ë¥??•ì¸?©ë‹ˆ??            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">?Œë«??ë²„ì „</span>
              <span className="text-sm text-muted-foreground">v1.0.0</span>
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">?°ì´?°ë² ?´ìŠ¤ ?íƒœ</span>
              <span className="text-sm text-green-600">?•ìƒ</span>
            </div>
            <div className="border-t" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">ë§ˆì?ë§?ë°±ì—…</span>
              <span className="text-sm text-muted-foreground">2025-01-06 12:00:00</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

