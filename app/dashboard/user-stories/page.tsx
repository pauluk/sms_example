
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, CircleDashed } from "lucide-react"

const USER_STORIES = [
    {
        id: "US-001",
        role: "User",
        feature: "Authentication",
        story: "I want to sign in securely using my email, passkey, or magic link so that I can access the system.",
        status: "Completed",
        priority: "High"
    },
    {
        id: "US-002",
        role: "User",
        feature: "SMS Sending",
        story: "I want to send SMS messages to individuals or bulk recipients using defined templates.",
        status: "Completed",
        priority: "High"
    },
    {
        id: "US-003",
        role: "Admin",
        feature: "User Management",
        story: "I want to view, manage, and assign roles/teams to users so that the system is organized.",
        status: "Completed",
        priority: "Medium"
    },
    {
        id: "US-004",
        role: "Admin",
        feature: "System Config",
        story: "I want to restrict signup domains and toggle 'Live SMS' mode to control system access and costs.",
        status: "Completed",
        priority: "High"
    },
    {
        id: "US-005",
        role: "System",
        feature: "Logging",
        story: "The system should log all SMS attempts with status (sent/failed) for audit purposes.",
        status: "Completed",
        priority: "High"
    },
    {
        id: "US-006",
        role: "User",
        feature: "Branding",
        story: "I want to see the 'FinOps' branding and animations to verify I am in the correct application.",
        status: "Completed",
        priority: "Low"
    },
    {
        id: "US-007",
        role: "Admin",
        feature: "Quotas",
        story: "I want to set an annual SMS quota (resetting April 1st) to manage budget.",
        status: "Completed",
        priority: "Medium"
    },
    {
        id: "US-008",
        role: "User",
        feature: "Usage Metrics",
        story: "I want to see a forecast of my usage vs the annual quota so I can plan accordingly.",
        status: "Completed",
        priority: "Medium"
    },
    {
        id: "US-009",
        role: "Admin",
        feature: "Access Control",
        story: "I want to toggle whether regular users can see the Usage page.",
        status: "Completed",
        priority: "Low"
    }
];

export default function UserStoriesPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">User Stories</h1>
                <p className="text-muted-foreground">
                    A list of user stories and requirements that define the current application functionality.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Implementation Status</CardTitle>
                    <CardDescription>Grid view of all tracked user stories.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Feature</TableHead>
                                <TableHead className="w-[40%]">Story</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead className="text-right">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {USER_STORIES.map((story) => (
                                <TableRow key={story.id}>
                                    <TableCell className="font-medium">{story.id}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{story.role}</Badge>
                                    </TableCell>
                                    <TableCell>{story.feature}</TableCell>
                                    <TableCell>{story.story}</TableCell>
                                    <TableCell>
                                        <Badge variant={story.priority === 'High' ? 'default' : 'secondary'} className={story.priority === 'High' ? 'bg-red-100 text-red-800 hover:bg-red-100' : ''}>
                                            {story.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-sm text-green-600 font-medium">Completed</span>
                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
