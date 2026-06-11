import React, { useState, useEffect } from 'react';
import {
  Building2, Briefcase, Users, KeyRound,
  Plus, Edit2, Trash2, X, Check, AlertCircle,
  ChevronDown, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '../../supabase/client';

const TABS = [
  { id: 'areas',    label: 'Áreas',     icon: Building2 },
  { id: 'cargos',   label: 'Cargos',    icon: Briefcase },
  { id: 'usuarios', label: 'Usuarios',  icon: Users },
  { id: 'password', label: 'Contraseña', icon: KeyRound },
];

const rolBadge = (rol) => {
  const map = {
    admin:    'bg-indigo-50 text-indigo-700 border border-indigo-200',
    rrhh:     'bg-blue-50 text-blue-700 border border-blue-200',
    empleado: 'bg-slate-50 text-slate-600 border border-slate-200',
  };
  return `${map[rol] || 'bg-slate-50 text-slate-500'} px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide`;
};

const colorAvatar = (str) => {
  const colores = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-cyan-100 text-cyan-700',
    'bg-sky-100 text-sky-700',
    'bg-violet-100 text-violet-700',
  ];
  let hash = 0;
  for (let c of (str || '')) hash += c.charCodeAt(0);
  return colores[hash % colores.length];
};

// ── componente genérico para Áreas y Cargos ──
function TablaSimple({ tabla, campo, label }) {
  const [items, setItems]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [inputNuevo, setInputNuevo] = useState('');
  const [editando, setEditando]   = useState(null); // { id, valor }
  const [error, setError]         = useState('');
  const [modalEliminar, setModalEliminar] = useState(null);
  const campoId = `id_${tabla}`;

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    const { data } = await supabase.from(tabla).select('*').order(campo);
    setItems(data || []);
    setLoading(false);
  };

  const agregar = async () => {
    const val = inputNuevo.trim();
    if (!val) { setError('El nombre no puede estar vacío.'); return; }
    if (items.some(i => i[campo].toLowerCase() === val.toLowerCase())) {
      setError(`Ya existe un ${label.toLowerCase()} con ese nombre.`); return;
    }
    const { error: err } = await supabase.from(tabla).insert({ [campo]: val });
    if (err) { setError('Error al guardar.'); return; }
    setInputNuevo('');
    setError('');
    await cargar();
  };

  const guardarEdicion = async () => {
    const val = editando.valor.trim();
    if (!val) { setError('El nombre no puede estar vacío.'); return; }
    const { error: err } = await supabase.from(tabla).update({ [campo]: val }).eq(campoId, editando.id);
    if (err) { setError('Error al actualizar.'); return; }
    setEditando(null);
    setError('');
    await cargar();
  };

  const confirmarEliminar = async () => {
    const { error: err } = await supabase.from(tabla).delete().eq(campoId, modalEliminar.id);
    if (err) {
      setError(`No se puede eliminar — puede estar en uso por algún empleado.`);
      setModalEliminar(null);
      return;
    }
    setModalEliminar(null);
    await cargar();
  };

  if (loading) return <p className="text-sm text-slate-400 py-6 text-center animate-pulse">Cargando...</p>;

  return (
    <>
      {/* modal eliminar */}
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Eliminar {label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-5">
              ¿Eliminar <span className="font-semibold text-slate-800">{modalEliminar.nombre}</span>?
              Si tiene empleados asignados no se podrá eliminar.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarEliminar}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* input agregar */}
        <div className="flex gap-2">
          <input
            type="text"
            value={inputNuevo}
            onChange={e => { setInputNuevo(e.target.value); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && agregar()}
            placeholder={`Nombre del ${label.toLowerCase()}...`}
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
          />
          <button onClick={agregar}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#004bb4] hover:bg-[#003a8c] text-white text-sm font-semibold rounded-xl transition-colors">
            <Plus size={15} />
            Agregar
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* lista */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Sin {label.toLowerCase()}s registrados</p>
          ) : (
            items.map((item, i) => (
              <div key={item[campoId]}
                className={`flex items-center justify-between px-5 py-3 ${i !== items.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/60 transition-colors`}>
                {editando?.id === item[campoId] ? (
                  <input
                    autoFocus
                    value={editando.valor}
                    onChange={e => setEditando({ ...editando, valor: e.target.value })}
                    onKeyDown={e => { if (e.key === 'Enter') guardarEdicion(); if (e.key === 'Escape') setEditando(null); }}
                    className="flex-1 mr-3 border border-[#004bb4] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30"
                  />
                ) : (
                  <span className="text-sm font-medium text-slate-700">{item[campo]}</span>
                )}
                <div className="flex items-center gap-1 shrink-0">
                  {editando?.id === item[campoId] ? (
                    <>
                      <button onClick={guardarEdicion}
                        className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditando(null)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditando({ id: item[campoId], valor: item[campo] }); setError(''); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#004bb4] hover:bg-[#eef4fc] transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => setModalEliminar({ id: item[campoId], nombre: item[campo] })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        <p className="text-[11px] text-slate-400">
          {items.length} {label.toLowerCase()}{items.length !== 1 ? 's' : ''} registrado{items.length !== 1 ? 's' : ''}
        </p>
      </div>
    </>
  );
}

// ── tab usuarios ──
function TabUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [cambiando, setCambiando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm]         = useState({ usuario: '', contrasena: '', id_rol: '' });
  const [error, setError]       = useState('');
  const [guardando, setGuardando] = useState(false);
  const [verPass, setVerPass]   = useState(false);

  useEffect(() => { cargar(); }, []);

  const cargar = async () => {
    setLoading(true);
    const [{ data: u }, { data: r }] = await Promise.all([
      supabase.from('usuario').select('*, rol:id_rol(nombre_rol)').order('id_usuario'),
      supabase.from('rol').select('*'),
    ]);
    setUsuarios(u || []);
    setRoles(r || []);
    setLoading(false);
  };

  const cambiarRol = async (id, nuevoRol) => {
    setCambiando(id);
    await supabase.from('usuario').update({ id_rol: parseInt(nuevoRol) }).eq('id_usuario', id);
    await cargar();
    setCambiando(null);
  };

  const confirmarEliminar = async () => {
    await supabase.from('usuario').delete().eq('id_usuario', modalEliminar.id);
    setModalEliminar(null);
    await cargar();
  };

  const crearUsuario = async () => {
    if (!form.usuario.trim() || !form.contrasena.trim() || !form.id_rol) {
      setError('Completa todos los campos.'); return;
    }
    setGuardando(true);
    const { error: err } = await supabase.from('usuario').insert({
      usuario: form.usuario.trim(),
      contrasena: form.contrasena,
      id_rol: parseInt(form.id_rol),
    });
    if (err) {
      setError('Error al crear — el usuario ya puede existir.');
    } else {
      setForm({ usuario: '', contrasena: '', id_rol: '' });
      setMostrarForm(false);
      setError('');
      await cargar();
    }
    setGuardando(false);
  };

  if (loading) return <p className="text-sm text-slate-400 py-6 text-center animate-pulse">Cargando...</p>;

  return (
    <>
      {modalEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Eliminar usuario</h4>
                <p className="text-xs text-slate-500 mt-0.5">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-5">
              ¿Eliminar al usuario <span className="font-semibold text-slate-800">{modalEliminar.nombre}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setModalEliminar(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarEliminar}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* botón nuevo usuario */}
        <div className="flex justify-end">
          <button onClick={() => { setMostrarForm(!mostrarForm); setError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#004bb4] hover:bg-[#003a8c] text-white text-sm font-semibold rounded-xl transition-colors">
            {mostrarForm ? <X size={15} /> : <Plus size={15} />}
            {mostrarForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>

        {/* form nuevo */}
        {mostrarForm && (
          <div className="bg-[#eef4fc] border border-[#004bb4]/20 rounded-2xl p-5 space-y-3">
            <h4 className="text-sm font-bold text-[#002d6b]">Crear nuevo usuario</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={form.usuario}
                onChange={e => setForm({ ...form, usuario: e.target.value })}
                className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
              />
              <div className="relative">
                <input
                  type={verPass ? 'text' : 'password'}
                  placeholder="Contraseña"
                  value={form.contrasena}
                  onChange={e => setForm({ ...form, contrasena: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                />
                <button onClick={() => setVerPass(!verPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {verPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <div className="relative">
                <select
                  value={form.id_rol}
                  onChange={e => setForm({ ...form, id_rol: e.target.value })}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
                >
                  <option value="">Seleccionar rol...</option>
                  {roles.map(r => (
                    <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <div className="flex justify-end">
              <button onClick={crearUsuario} disabled={guardando}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#004bb4] hover:bg-[#003a8c] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
                <Check size={15} />
                {guardando ? 'Creando...' : 'Crear Usuario'}
              </button>
            </div>
          </div>
        )}

        {/* lista usuarios */}
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          {usuarios.map((u, i) => {
            const ini = u.usuario?.substring(0, 2).toUpperCase();
            const avatar = colorAvatar(u.usuario);
            return (
              <div key={u.id_usuario}
                className={`flex items-center justify-between px-5 py-3.5 ${i !== usuarios.length - 1 ? 'border-b border-slate-50' : ''} hover:bg-slate-50/60 transition-colors`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${avatar} flex items-center justify-center text-[11px] font-bold shrink-0`}>
                    {ini}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{u.usuario}</p>
                    <span className={rolBadge(u.rol?.nombre_rol)}>{u.rol?.nombre_rol}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* cambiar rol */}
                  <div className="relative">
                    <select
                      value={u.id_rol}
                      onChange={e => cambiarRol(u.id_usuario, e.target.value)}
                      disabled={cambiando === u.id_usuario}
                      className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/20 disabled:opacity-50 transition-all"
                    >
                      {roles.map(r => (
                        <option key={r.id_rol} value={r.id_rol}>{r.nombre_rol}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                  <button onClick={() => setModalEliminar({ id: u.id_usuario, nombre: u.usuario })}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-slate-400">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
      </div>
    </>
  );
}

// ── tab contraseña ──
function TabPassword() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
  const [form, setForm]       = useState({ actual: '', nueva: '', confirmar: '' });
  const [verActual, setVerActual]     = useState(false);
  const [verNueva, setVerNueva]       = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [error, setError]     = useState('');
  const [exito, setExito]     = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cambiar = async () => {
    setError('');
    setExito(false);
    if (!form.actual || !form.nueva || !form.confirmar) {
      setError('Completa todos los campos.'); return;
    }
    if (form.nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.'); return;
    }
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden.'); return;
    }
    setGuardando(true);

    // verificar contraseña actual
    const { data } = await supabase
      .from('usuario')
      .select('id_usuario')
      .eq('usuario', usuario.usuario)
      .eq('contrasena', form.actual)
      .single();

    if (!data) {
      setError('La contraseña actual es incorrecta.');
      setGuardando(false);
      return;
    }

    const { error: err } = await supabase
      .from('usuario')
      .update({ contrasena: form.nueva })
      .eq('id_usuario', data.id_usuario);

    if (err) {
      setError('Error al actualizar la contraseña.');
    } else {
      setExito(true);
      setForm({ actual: '', nueva: '', confirmar: '' });
    }
    setGuardando(false);
  };

  const InputPass = ({ label, campo, ver, setVer }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={ver ? 'text' : 'password'}
          value={form[campo]}
          onChange={e => { setForm({ ...form, [campo]: e.target.value }); setError(''); setExito(false); }}
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-10 text-sm text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#004bb4]/30 focus:border-[#004bb4] transition-all"
        />
        <button onClick={() => setVer(!ver)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {ver ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-sm space-y-4">
      <div className="flex items-center gap-3 bg-[#eef4fc] rounded-xl px-4 py-3">
        <div className={`w-9 h-9 rounded-full ${colorAvatar(usuario.usuario)} flex items-center justify-center text-xs font-bold shrink-0`}>
          {usuario.usuario?.substring(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-800">{usuario.usuario}</p>
          <p className="text-xs text-slate-500 capitalize">{usuario.rol}</p>
        </div>
      </div>

      <InputPass label="Contraseña actual" campo="actual" ver={verActual} setVer={setVerActual} />
      <InputPass label="Nueva contraseña" campo="nueva" ver={verNueva} setVer={setVerNueva} />
      <InputPass label="Confirmar nueva contraseña" campo="confirmar" ver={verConfirmar} setVer={setVerConfirmar} />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-medium px-4 py-2.5 rounded-xl">
          <AlertCircle size={13} /> {error}
        </div>
      )}
      {exito && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-4 py-2.5 rounded-xl">
          <Check size={13} /> Contraseña actualizada correctamente
        </div>
      )}

      <button onClick={cambiar} disabled={guardando}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#004bb4] hover:bg-[#003a8c] text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60">
        <KeyRound size={15} />
        {guardando ? 'Guardando...' : 'Cambiar Contraseña'}
      </button>
    </div>
  );
}

// ── componente principal ──
export default function Configuracion() {
  const [tabActiva, setTabActiva] = useState('areas');

  return (
    <>
      {/* HEADER */}
      <header className="bg-[#d0e3fc] rounded-2xl px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h2 className="font-extrabold text-[#002d6b] tracking-wide text-sm uppercase">
            Configuración
          </h2>
          <p className="text-xs text-[#002d6b]/60 mt-0.5">
            Gestión de áreas, cargos, usuarios y cuenta
          </p>
        </div>
        <span className="text-xs font-semibold text-[#002d6b]/80 bg-white/40 px-3 py-1 rounded-full">
          {new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' })}
        </span>
      </header>

      {/* TABS + CONTENIDO */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* tabs */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition-all ${
                  activa
                    ? 'border-[#004bb4] text-[#004bb4] bg-[#eef4fc]/50'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={activa ? 'text-[#004bb4]' : 'text-slate-400'} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* contenido */}
        <div className="p-6">
          {tabActiva === 'areas' && (
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">Áreas de la empresa</h3>
                <p className="text-xs text-slate-400 mt-0.5">Administra las áreas a las que pertenecen los empleados</p>
              </div>
              <TablaSimple tabla="area" campo="nombre_area" label="Área" />
            </div>
          )}
          {tabActiva === 'cargos' && (
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">Cargos</h3>
                <p className="text-xs text-slate-400 mt-0.5">Administra los cargos disponibles para los empleados</p>
              </div>
              <TablaSimple tabla="cargo" campo="nombre_cargo" label="Cargo" />
            </div>
          )}
          {tabActiva === 'usuarios' && (
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">Usuarios del sistema</h3>
                <p className="text-xs text-slate-400 mt-0.5">Gestiona el acceso y roles de los usuarios</p>
              </div>
              <TabUsuarios />
            </div>
          )}
          {tabActiva === 'password' && (
            <div>
              <div className="mb-5">
                <h3 className="text-sm font-bold text-slate-900">Cambiar contraseña</h3>
                <p className="text-xs text-slate-400 mt-0.5">Actualiza la contraseña de tu cuenta actual</p>
              </div>
              <TabPassword />
            </div>
          )}
        </div>
      </div>
    </>
  );
}