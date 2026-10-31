import {
  Globe,
  MessageSquare,
  BookOpen,
  Link as LinkIcon,
  Server,
  Send,
  Users,
  ExternalLink,
  Mail,
  Link2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CryptoAssetResponse } from "@/lib/asset-api";
import { hasValue } from "@/lib/asset-format";

type SocialsType = NonNullable<CryptoAssetResponse["socials"]>;

type CryptoSocialsProps = {
  socials: SocialsType;
};

const SOCIAL_GROUPS: Array<{
  key: keyof SocialsType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  render: (value: SocialsType[keyof SocialsType]) => React.ReactNode;
}> = [
  {
    key: "homepage",
    label: "Official Website",
    icon: Globe,
    render: (value) => {
      const urls = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Globe className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      );
    },
  },
  {
    key: "twitter",
    label: "Twitter / X",
    icon: Send,
    render: (value) => {
      const handle = value as string;
      return (
        <a
          href={`https://twitter.com/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Send className="size-3.5" />
          @{handle}
          <ExternalLink className="size-3" />
        </a>
      );
    },
  },
  {
    key: "telegram",
    label: "Telegram",
    icon: Send,
    render: (value) => {
      const handle = value as string;
      return (
        <a
          href={`https://t.me/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <Send className="size-3.5" />
          {handle}
          <ExternalLink className="size-3" />
        </a>
      );
    },
  },
  {
    key: "discord",
    label: "Discord",
    icon: MessageSquare,
    render: (value) => {
      const handle = value as string;
      return (
        <a
          href={`https://discord.gg/${handle}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <MessageSquare className="size-3.5" />
          {handle}
          <ExternalLink className="size-3" />
        </a>
      );
    },
  },
  {
    key: "chatUrls",
    label: "Chat",
    icon: MessageSquare,
    render: (value) => {
      const urls = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <MessageSquare className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "").slice(0, 40)}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      );
    },
  },
  {
    key: "subreddit",
    label: "Reddit",
    icon: LinkIcon,
    render: (value) => {
      const url = value as string;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <LinkIcon className="size-3.5" />
          {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
          <ExternalLink className="size-3" />
        </a>
      );
    },
  },
  {
    key: "repos",
    label: "Repositories",
    icon: Server,
    render: (value) => {
      const repoObj = value as { github?: string[]; bitbucket?: string[] };
      return (
        <div className="flex flex-wrap gap-2">
          {repoObj.github?.map((url, idx) => (
            <a
              key={`gh-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Server className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
              <ExternalLink className="size-3" />
            </a>
          ))}
          {repoObj.bitbucket?.map((url, idx) => (
            <a
              key={`bb-${idx}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Server className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      );
    },
  },
  {
    key: "whitepaper",
    label: "Whitepaper",
    icon: BookOpen,
    render: (value) => {
      const url = value as string;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <BookOpen className="size-3.5" />
          {url.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
          <ExternalLink className="size-3" />
        </a>
      );
    },
  },
  {
    key: "blockchainSites",
    label: "Block Explorers",
    icon: Link2,
    render: (value) => {
      const urls = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Link2 className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "").slice(0, 40)}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      );
    },
  },
  {
    key: "announcementUrls",
    label: "Announcements",
    icon: Send,
    render: (value) => {
      const urls = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Send className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "").slice(0, 40)}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      );
    },
  },
  {
    key: "officialForumUrls",
    label: "Official Forums",
    icon: Users,
    render: (value) => {
      const urls = (value as string[]) ?? [];
      return (
        <div className="flex flex-wrap gap-2">
          {urls.map((url, idx) => (
            <a
              key={idx}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              <Users className="size-3.5" />
              {url.replace(/^https?:\/\//i, "").replace(/\/$/, "").slice(0, 40)}
              <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      );
    },
  },
];

export function CryptoSocials({ socials }: CryptoSocialsProps) {
  const availableGroups = SOCIAL_GROUPS.filter((group) => {
    const value = socials[group.key];
    if (Array.isArray(value)) return value.length > 0;
    return hasValue(value as string | null);
  });

  if (availableGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="size-4" />
            Social Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No social links available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="size-4" />
          Social Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {availableGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-2">
            {groupIdx > 0 && <Separator />}
            <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <group.icon className="size-3" />
              {group.label}
            </h4>
            <div className="flex flex-wrap gap-2">
              {group.render(socials[group.key]!)}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}