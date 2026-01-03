"use client";

import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Edit2, Plus, Search, ArrowUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UserStory {
    id: string;
    role: string;
    feature: string;
    story: string;
    priority: string;
    status: string;
    acceptanceCriteria?: string;
}

export default function UserStoriesManager({ isAdmin }: { isAdmin: boolean }) {
    const [stories, setStories] = useState<UserStory[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState("");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [roleFilter, setRoleFilter] = useState("all");

    // Sorting
    const [sortConfig, setSortConfig] = useState<{ key: keyof UserStory; direction: 'asc' | 'desc' } | null>(null);

    // Editing/Creating
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStory, setEditingStory] = useState<UserStory | null>(null);
    const [formData, setFormData] = useState<Partial<UserStory>>({});

    useEffect(() => {
        fetchStories();
    }, []);

    const fetchStories = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/user-stories");
            if (res.ok) {
                const data = await res.json();
                setStories(data);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load user stories");
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key: keyof UserStory) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const filteredStories = useMemo(() => {
        let filtered = [...stories];

        if (search) {
            const lower = search.toLowerCase();
            filtered = filtered.filter(s =>
                s.story.toLowerCase().includes(lower) ||
                s.feature.toLowerCase().includes(lower) ||
                s.id.toLowerCase().includes(lower)
            );
        }

        if (priorityFilter !== 'all') {
            filtered = filtered.filter(s => s.priority === priorityFilter);
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(s => s.status === statusFilter);
        }

        if (sortConfig) {
            filtered.sort((a, b) => {
                const aVal = a[sortConfig.key] || "";
                const bVal = b[sortConfig.key] || "";

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    }, [stories, search, priorityFilter, statusFilter, sortConfig]);

    const handleSave = async () => {
        const url = "/api/user-stories";
        const method = editingStory ? "PUT" : "POST";
        const body = editingStory ? { ...formData, id: editingStory.id } : formData;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success(editingStory ? "Story updated" : "Story created");
            fetchStories();
            setIsDialogOpen(false);
        } catch (err) {
            toast.error("Error saving story");
        }
    };

    const openEdit = (story: UserStory) => {
        setEditingStory(story);
        setFormData({ ...story });
        setIsDialogOpen(true);
    };

    const openCreate = () => {
        setEditingStory(null);
        setFormData({
            priority: 'Medium',
            status: 'Backlog',
            role: 'User'
        });
        setIsDialogOpen(true);
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-white p-4 rounded-lg border shadow-sm">
                <div className="flex flex-1 gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:max-w-xs">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search stories..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="Critical">Critical</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="Backlog">Backlog</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button onClick={openCreate} className="whitespace-nowrap">
                        <Plus className="mr-2 h-4 w-4" /> New Story
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px] cursor-pointer" onClick={() => handleSort('id')}>
                                ID {sortConfig?.key === 'id' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('role')}>
                                Role {sortConfig?.key === 'role' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('feature')}>
                                Feature {sortConfig?.key === 'feature' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            <TableHead className="w-[40%]">Story</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => handleSort('priority')}>
                                Priority {sortConfig?.key === 'priority' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => handleSort('status')}>
                                Status {sortConfig?.key === 'status' && <ArrowUpDown className="inline h-3 w-3 ml-1" />}
                            </TableHead>
                            {isAdmin && <TableHead className="w-[50px]"></TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredStories.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No stories found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredStories.map((story) => (
                                <TableRow key={story.id}>
                                    <TableCell className="font-medium font-mono text-xs">{story.id}</TableCell>
                                    <TableCell><Badge variant="outline">{story.role}</Badge></TableCell>
                                    <TableCell className="text-sm">{story.feature}</TableCell>
                                    <TableCell className="text-sm">{story.story}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={story.priority === 'High' || story.priority === 'Critical' ? 'destructive' : 'secondary'}
                                            className={story.priority === 'Critical' ? 'bg-red-600 hover:bg-red-700' : ''}
                                        >
                                            {story.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge
                                            variant="outline"
                                            className={
                                                story.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    story.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                                        story.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                            story.status === 'Backlog' ? 'bg-zinc-100 text-zinc-600 border-zinc-200' :
                                                                'bg-gray-50 text-gray-700 border-gray-200'
                                            }
                                        >
                                            {story.status}
                                        </Badge>
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            <Button variant="ghost" size="icon" onClick={() => openEdit(story)}>
                                                <Edit2 className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit DIALOG */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingStory ? 'Edit User Story' : 'Create User Story'}</DialogTitle>
                        <div className="text-sm text-muted-foreground">
                            {editingStory ? 'Modify the details of an existing user story.' : 'Add a new user story to the backlog.'}
                        </div>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input value={formData.role || ''} onChange={(e) => setFormData({ ...formData, role: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Feature</Label>
                                <Input value={formData.feature || ''} onChange={(e) => setFormData({ ...formData, feature: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Story Description</Label>
                            <Textarea
                                value={formData.story || ''}
                                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                                className="min-h-[100px]"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select value={formData.priority} onValueChange={(val) => setFormData({ ...formData, priority: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Critical">Critical</SelectItem>
                                        <SelectItem value="High">High</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                    disabled={!isAdmin && !editingStory} // Disable for non-admins creating/viewing
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Backlog">Backlog</SelectItem>
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Acceptance Criteria (JSON Array string)</Label>
                            <Input
                                placeholder='["Criteria 1", "Criteria 2"]'
                                value={formData.acceptanceCriteria || ''}
                                onChange={(e) => setFormData({ ...formData, acceptanceCriteria: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
