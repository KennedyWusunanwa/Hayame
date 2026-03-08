import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { siteFlags } from "@/lib/site-flags";

const posts = [
  {
    title: "Driving Accra: parking hacks near the business district",
    date: "Nov 4, 2025",
    tag: "Cities",
  },
  {
    title: "Weekend routes: Cape Coast castles and beach escapes",
    date: "Oct 12, 2025",
    tag: "Trips",
  },
  {
    title: "How to prepare your car for hosting on Hayame",
    date: "Sep 3, 2025",
    tag: "Hosts",
  },
];

export default function BlogPage() {
  if (!siteFlags.marketing.blogPage) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm font-semibold text-primary">Blog</p>
        <h1 className="text-3xl font-semibold text-foreground">Updates & road stories</h1>
        <p className="text-gray-700">
          Fresh tips for driving, hosting, and exploring Ghana with Hayame.
        </p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {posts.map((post) => (
          <Card key={post.title} className="border border-border">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                {post.title}
                <ArrowUpRight className="h-5 w-5 text-primary" />
              </CardTitle>
              <div className="text-xs font-semibold uppercase text-primary">{post.tag}</div>
              <div className="text-sm text-gray-600">{post.date}</div>
            </CardHeader>
            <CardContent>
              <Link href="/contact" className="text-sm font-semibold text-primary hover:underline">
                Read more
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
