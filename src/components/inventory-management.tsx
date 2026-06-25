'use client';

import * as React from 'react';
import {
    Laptop,
    Monitor,
    Printer,
    Search,
    Plus,
    MoreVertical,
    Info,
    Tag as TagIcon,
    Package,
    Layers,
    ChevronRight,
    Filter,
    LayoutGrid,
    List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';

const MOCK_INVENTORY = [
    { id: '1', name: 'Laptop Dell XPS 15', category: 'Laptops', stock: 5, status: 'Disponible', code: 'IT-001', icon: Laptop, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    { id: '2', name: 'Monitor HP M24f', category: 'Monitores', stock: 12, status: 'Disponible', code: 'IT-002', icon: Monitor, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
    { id: '3', name: 'Impresora Epson L3250', category: 'Impresoras', stock: 3, status: 'Bajo Stock', code: 'IT-003', icon: Printer, color: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30' },
    { id: '4', name: 'MacBook Pro M2', category: 'Laptops', stock: 0, status: 'Agotado', code: 'IT-004', icon: Laptop, color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
    { id: '5', name: 'Monitor LG UltraWide', category: 'Monitores', stock: 8, status: 'Disponible', code: 'IT-005', icon: Monitor, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' },
];

export function InventoryManagement() {
    const [search, setSearch] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

    const filteredItems = MOCK_INVENTORY.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Premium */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-gradient-to-r from-slate-900 to-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border border-slate-700/50">
                <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                    <Package size={200} className="text-white" />
                </div>

                <div className="relative z-10 text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20">
                            <Layers className="h-8 w-8 text-blue-400" />
                        </div>
                        <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider">
                            Control de Activos
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter">
                        Inventario IT
                    </h1>
                    <p className="text-slate-400 mt-4 font-medium text-xl max-w-xl">
                        Gestión centralizada de recursos tecnológicos y equipamiento médico especializado.
                    </p>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                        <Input
                            placeholder="Buscar por nombre o código..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-12 h-14 w-full md:w-80 rounded-2xl border-0 bg-white/5 text-white placeholder:text-slate-500 focus:bg-white/10 transition-all font-medium text-lg ring-1 ring-white/10 focus:ring-blue-500/50"
                        />
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="h-14 px-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 border-0 flex gap-3 transition-transform active:scale-95">
                                <Plus className="h-6 w-6" />
                                <span>Nuevo Equipo</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md rounded-[2rem] border-slate-800 bg-slate-900 text-white">
                            <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">Agregar al Inventario</DialogTitle>
                            </DialogHeader>
                            <div className="p-6 space-y-4">
                                <p className="text-slate-400">Formulario de registro de nuevo activo IT.</p>
                                {/* Form placeholder */}
                                <div className="h-40 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500 font-medium">
                                    Área de Formulario
                                </div>
                                <Button className="w-full h-12 rounded-xl bg-blue-600 font-bold">Guardar Activo</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Categories & Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Equipos', value: '142', sub: '+12 este mes', icon: Package, color: 'bg-emerald-500' },
                    { label: 'En Préstamo', value: '28', sub: '8 pendientes', icon: ChevronRight, color: 'bg-blue-500' },
                    { label: 'Bajo Stock', value: '5', sub: 'Requiere atención', icon: TagIcon, color: 'bg-amber-500' },
                    { label: 'Mantenimiento', value: '3', sub: 'En servicio técnico', icon: Info, color: 'bg-rose-500' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm transition-transform hover:-translate-y-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-xl ${stat.color} text-white`}>
                                <stat.icon size={20} />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase font-bold text-slate-400 border-slate-200">Stats</Badge>
                        </div>
                        <div className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                        <div className="mt-2 text-[10px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full inline-block">
                            {stat.sub}
                        </div>
                    </div>
                ))}
            </div>

            {/* Catalog Display */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Catálogo de Activos</h2>
                        <Badge className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border-0">{filteredItems.length} items</Badge>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <Button
                            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg"
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid size={16} />
                        </Button>
                        <Button
                            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            className="h-8 w-8 p-0 rounded-lg"
                            onClick={() => setViewMode('list')}
                        >
                            <List size={16} />
                        </Button>
                    </div>
                </div>

                <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
                    {filteredItems.map((item) => (
                        <Card key={item.id} className="group relative bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 border-b-4 border-b-blue-500/20 hover:border-b-blue-500">
                            <CardContent className="p-8">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-5 rounded-3xl ${item.color} transition-transform group-hover:scale-110 duration-500`}>
                                        <item.icon className="h-8 w-8" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-10 w-10 p-0 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
                                                <MoreVertical size={20} className="text-slate-400" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="rounded-2xl border-slate-100">
                                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                            <DropdownMenuItem className="cursor-pointer gap-2"><Info size={16} /> Ver detalles</DropdownMenuItem>
                                            <DropdownMenuItem className="cursor-pointer gap-2"><TagIcon size={16} /> Editar etiquetas</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full w-fit mb-2">
                                        {item.code}
                                    </div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                        {item.name}
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{item.category}</p>
                                </div>

                                <div className="mt-8 flex items-center justify-between border-t border-slate-50 dark:border-slate-800 pt-6 font-bold">
                                    <div className="flex flex-col">
                                        <span className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">Stock Actual</span>
                                        <span className="text-2xl text-slate-900 dark:text-white">{item.stock}</span>
                                    </div>
                                    <Badge className={`rounded-lg px-3 py-1 border-0 ${item.status === 'Disponible' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                            item.status === 'Bajo Stock' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                                        }`}>
                                        {item.status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
}
