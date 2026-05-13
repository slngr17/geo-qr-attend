import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  Plus, 
  MoreVertical,
  QrCode,
  MapPin,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router';

const mockClasses = [
  { id: '1', name: 'Intro to Computer Science', code: 'CS101', students: 45, attendance: 92 },
  { id: '2', name: 'Advanced Web Development', code: 'CS302', students: 28, attendance: 88 },
  { id: '3', name: 'Software Engineering', code: 'CS405', students: 32, attendance: 95 },
];

const attendanceData = [
  { name: 'Mon', attendance: 85 },
  { name: 'Tue', attendance: 92 },
  { name: 'Wed', attendance: 88 },
  { name: 'Thu', attendance: 94 },
  { name: 'Fri', attendance: 90 },
];

export function InstructorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Students', value: '105', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { title: 'Active Classes', value: '3', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
          { title: 'Avg. Attendance', value: '91.6%', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { title: 'Pending Reports', value: '2', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
              </div>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Classes Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Classes</CardTitle>
              <CardDescription>Management and quick actions for your current courses</CardDescription>
            </div>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" /> New Class
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockClasses.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="font-medium">{cls.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cls.code}</Badge>
                    </TableCell>
                    <TableCell>{cls.students}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500" 
                            style={{ width: `${cls.attendance}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{cls.attendance}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" title="View Geofence">
                          <MapPin className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Manage Session" onClick={() => navigate(`/instructor/session/${cls.id}`)}>
                          <QrCode className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>Average attendance across all classes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="attendance" fill="oklch(0.205 0 0)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance Logs</CardTitle>
          <CardDescription>Live updates from your current active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Student {i + 1}</p>
                    <p className="text-xs text-muted-foreground">Marked present for CS101 • {i * 5 + 2} mins ago</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none">
                  Verified
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}