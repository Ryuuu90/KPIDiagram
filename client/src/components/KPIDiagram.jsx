import React, { useCallback, useEffect, useMemo, useRef, useState, memo } from 'react';
import { useTranslation } from 'react-i18next';
import ReactFlow, {
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Pencil, Play, RotateCcw } from "lucide-react";
import api from '../utils/api';
import axios from 'axios';
import { motion } from 'framer-motion';
import './KPIDiagram.css'
import { useDiagram } from '../contexts/DiagramContext';
import LoanCalculator from './loanCalculator'
import Elements from './Elements';
import toast, { Toaster } from "react-hot-toast";
import { useDeepCompareEffect } from 'use-deep-compare';
import { FaBalanceScale, FaChartBar, FaLeaf, FaFileInvoice } from "react-icons/fa";
import { calculateResults } from './loanCalculator';

import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import { Search, ChevronLeft, ChevronRight, Database, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


// const URL = process.env.REACT_APP_BACKEND_URL;


// ---------------------------------------------------------------------------
// AffectedElementsTable
// ---------------------------------------------------------------------------
const AffectedElementsTable = ({ Source, expandedNodes, setSource, reset, simulate }) => {
  const { t } = useTranslation();
  const [baseElements, setBaseElements] = useState([]);
  const [baseSlenght, setBasesLenght] = useState(0);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const affected = {
    'EC041': ['EC048', 'EC157', 'EC073', 'EC139'],
    'EC074': ['EC048', 'EC158', 'EC073', 'EC139'],
    'EC078': ['EC048', 'EC159', 'EC073', 'EC139'],
    'EC080': ['EC048', 'EC160', 'EC073', 'EC139'],
    'EC090': ['EC043'],
    'EC004': ['EC061'],
    'EC008': ['EC061']
  };

  const filtredVals = useRef(null);
  const nodes = [...expandedNodes, Source];

  useDeepCompareEffect(() => {
    const getAffectedElements = async () => {
      try {
        if (Object.keys(affected).some(key => nodes.includes(key))) {
          filtredVals.current = nodes
            .filter(key => affected[key] != undefined)
            .map(key => affected[key])
            .flat();
          const response = await api.post(`/affected`, { affected: filtredVals.current });
          setBaseElements(response.data.elements);
          setBasesLenght(response.data.elements.length);
        } else {
          setBaseElements([]);
          setBasesLenght(0);
        }
      } catch (error) {
        console.error(error);
        toast.error(t('common.error_loading_data') || "Erreur lors du chargement des données");
      }
    };
    getAffectedElements();
  }, [nodes, simulate, reset]);

  const formatNumber = (num) => {
    if (num === "-" || num === "" || num == null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "parentId",
        header: t('common.element_id'),
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: "nameFr",
        header: t('common.element_name'),
        cell: ({ row }) => <span>{t(`elements.${row.original.parentId}`, { defaultValue: row.original.nameFr })}</span>,
      },
      {
        accessorKey: "SoldeValue",
        header: t('common.balance_value'),
        cell: ({ getValue }) => <span>{formatNumber(getValue())}</span>,
      },
      {
        accessorKey: "newSold",
        header: t('common.new_balance'),
        cell: ({ getValue, row }) => {
          const elementId = row.original.parentId;
          const savedValue = filtredVals.current ? (filtredVals.current[elementId] || "-") : "-";
          return (
            <div className="flex items-center gap-2">
              <span>{savedValue === '-' && getValue() !== null ? formatNumber(getValue()) : formatNumber(savedValue)}</span>
            </div>
          );
        },
      },
    ],
    [baseSlenght, simulate, reset]
  );

  const table = useReactTable({
    data: baseElements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    table.setPageSize(baseSlenght);
  }, [baseSlenght]);

  return (
    <div>
      <table className="w-full h-full border border-gray-200">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm text-gray-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};


// ---------------------------------------------------------------------------
// SimulationTable
// ---------------------------------------------------------------------------
const SimulationTable = ({ Source, basesRef, setSource, reset }) => {
  const { t } = useTranslation();
  const [baseElements, setBaseElements] = useState([]);
  const [baseSlenght, setBasesLenght] = useState(0);
  const [editingRow, setEditingRow] = useState(null);
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  const handleSave = (elementId) => {
    if (inputRef.current) {
      const val = inputRef.current.value.trim();
      if (val.length > 12) return;
      basesRef.current[elementId] = val;
      setEditingRow(null);
    }
  };

  const formatNumber = (num) => {
    if (num === "-" || num === "" || num == null) return "-";
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(num));
  };

  useEffect(() => {
    const getBaseElements = async () => {
      try {
        const result = await api.post(`/search/`, { elementId: Source });
        setBaseElements(result.data.elements);
        setBasesLenght(result.data.elements.length);
      } catch (error) {
        console.error(error);
        toast.error(t('common.error_loading_elements') || "Erreur lors du chargement des éléments");
      }
    };
    getBaseElements();
  }, [Source, reset]);

  const columns = useMemo(
    () => [
      {
        accessorKey: "parentId",
        header: t('common.element_id'),
        cell: ({ getValue }) => <span>{getValue()}</span>,
      },
      {
        accessorKey: "nameFr",
        header: t('common.element_name'),
        cell: ({ row }) => <span>{t(`elements.${row.original.parentId}`, { defaultValue: row.original.nameFr })}</span>,
      },
      {
        accessorKey: "SoldeValue",
        header: t('common.balance_value'),
        cell: ({ getValue }) => <span>{formatNumber(getValue())}</span>,
      },
      {
        accessorKey: "newSold",
        header: t('common.new_balance'),
        cell: ({ getValue, row }) => {
          const elementId = row.original.parentId;
          const savedValue = basesRef.current[elementId] || "-";
          return (
            <div className="flex items-center gap-2">
              {editingRow === elementId ? (
                <input
                  type="number"
                  defaultValue={savedValue === "-" ? "" : savedValue}
                  ref={inputRef}
                  onBlur={() => handleSave(elementId)}
                  onKeyDown={(e) => e.key === "Enter" && handleSave(elementId)}
                  className="w-24 text-xs text-gray-800 border border-gray-300 rounded px-1"
                  autoFocus
                />
              ) : (
                <>
                  <span>{savedValue === '-' && getValue() !== null ? formatNumber(getValue()) : formatNumber(savedValue)}</span>
                  <button onClick={() => setEditingRow(elementId)}>
                    <Pencil size={14} className="text-gray-500 hover:text-gray-700" />
                  </button>
                </>
              )}
            </div>
          );
        },
      },
    ],
    [editingRow, reset]
  );

  const table = useReactTable({
    data: baseElements,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    table.setPageSize(baseSlenght);
  }, [baseSlenght]);

  return (
    <div>
      <table className="w-full h-full border border-gray-200">
        <thead className="bg-gray-100">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-4 text-gray-500">
                No data available
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="border-b hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm text-gray-800">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};


// ---------------------------------------------------------------------------
// TableExample (Reports)
// ---------------------------------------------------------------------------
const TableExample = () => {
  const { t } = useTranslation();
  const [allData, setAllData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [reportType, setReportType] = useState('Passif');
  const [isLoading, setIsLoading] = useState(false);

  const reports = [
    { name: t('reports.passif'), id: 'Passif', icon: <FaBalanceScale /> },
    { name: t('reports.actif'), id: 'Actif', icon: <FaChartBar /> },
    { name: t('reports.esg'), id: 'ESG', icon: <FaLeaf /> },
    { name: t('reports.cpc'), id: 'CPC', icon: <FaFileInvoice /> },
  ];

  useEffect(() => {
    const getAllData = async () => {
      setIsLoading(true);
      try {
        const response = await api.post(`/reports`, { reportType });
        setAllData(response.data.report);
      } catch (error) {
        console.error(error);
        toast.error(t('common.error_loading_reports') || "Erreur lors du chargement des rapports");
      } finally {
        setIsLoading(false);
      }
    };
    getAllData();
  }, [reportType]);

  const columns = useMemo(() => {
    if (reportType === 'CPC')
      return [
        {
          accessorKey: 'Nature',
          header: t('reports.nature'),
          cell: ({ getValue }) => {
            const value = getValue();
            return <span className="font-medium text-gray-800">{value ? value.trim() : ''}</span>;
          },
        },
        {
          accessorKey: "Operations propres l'exercice",
          header: t('reports.operations_propres'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Operations concernant les exercices precedents',
          header: t('reports.operations_precedents'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: "TOTAUX DE L'EXERCICE (3 = 2+1)",
          header: t('reports.totaux_exercice'),
          cell: ({ getValue }) => (
            <span className="font-bold text-indigo-700 px-2 py-1 rounded">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: "Totaux de l'exercice precedent",
          header: t('reports.totaux_precedent'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-gray-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
      ];

    if (reportType === 'ESG')
      return [
        {
          accessorKey: 'Definition',
          header: t('reports.definition'),
          cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue()}</span>,
        },
        {
          accessorKey: "Exercice",
          header: t('reports.exercice'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Exercice Precedent',
          header: t('reports.exercice_precedent'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
      ];

    if (reportType === 'Actif')
      return [
        {
          accessorKey: 'Actif',
          header: t('reports.actif'),
          cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue()}</span>,
        },
        {
          id: "exercice-brut",
          accessorFn: (row) => row.Exercice?.Brut || 0,
          header: t('reports.brut'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          id: "exercice-amortissements",
          accessorFn: (row) => row.Exercice?.['Amortissements et provisions'] || 0,
          header: t('reports.amortissements'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          id: "exercice-net",
          accessorFn: (row) => row.Exercice?.['Net'] || 0,
          header: t('reports.net_exercice'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Exercice Precedent',
          header: t('reports.exercice_precedent'),
          cell: ({ getValue }) => {
            const value = getValue() || 0;
            return (
              <span className="font-semibold text-blue-600">
                {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(value)}
              </span>
            );
          },
        },
      ];

    if (reportType === 'Passif')
      return [
        {
          accessorKey: 'Passif',
          header: t('reports.passif'),
          cell: ({ getValue }) => <span className="font-medium text-gray-800">{getValue()}</span>,
        },
        {
          accessorKey: "Exercice",
          header: t('reports.exercice'),
          cell: ({ getValue }) => (
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
        {
          accessorKey: 'Exercice Precedent',
          header: 'Exercice Precedent',
          cell: ({ getValue }) => (
            <span className="font-semibold text-blue-600">
              {new Intl.NumberFormat('en-EN', { maximumFractionDigits: 0 }).format(getValue())}
            </span>
          ),
        },
      ];

    return [];
  }, [reportType]);

  const table = useReactTable({
    data: allData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      globalFilter,
      sorting,
      pagination: { pageIndex: 0, pageSize: allData.length },
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="p-6 bg-transparent min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Report type selector */}
          <div className="flex gap-4 p-4 h-44 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-xl">
            {reports.map(({ name, icon }) => {
              const isActive = reportType === name;
              return (
                <div
                  key={name}
                  onClick={() => setReportType(name)}
                  className={`cursor-pointer relative flex flex-col justify-between rounded-2xl transition-all duration-700 transform overflow-hidden
                    ${isActive
                      ? "flex-[2] scale-100 bg-white/20 backdrop-blur-md text-white border border-white/30"
                      : "flex-1 bg-white/10 backdrop-blur-sm text-white/80 hover:bg-white/20 hover:scale-105 border border-white/10"}`}
                >
                  <div className="relative p-6 flex flex-col justify-between h-full">
                    <div className="flex items-center gap-3 mb-4 text-2xl">
                      <span className={`${isActive ? "text-orange-200" : "text-white/60"} transition-colors duration-300`}>
                        {icon}
                      </span>
                      <h2 className={`font-bold text-xl transition-colors duration-300 ${isActive ? "text-white text-3xl" : "text-white"}`}>
                        {name}
                      </h2>
                    </div>
                    <p className={`text-sm transition-colors duration-300 ${isActive ? "text-orange-50 duration-800 text-base" : "text-white/40"}`}>
                      {name === 'ESG' ? "Etats de solde de gestion"
                        : name === 'CPC' ? "Tableau des comptes de Produits et Charges"
                        : name === 'Passif' ? "Tableau du Passif"
                        : "Tableau de l'Actif"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Search controls */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={t('common.search_placeholder')}
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-orange-100 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all"
                />
              </div>
              <div className="text-sm text-gray-600">
                {table.getFilteredRowModel().rows.length} résultat(s)
              </div>
            </div>
          </div>

          {/* Table */}
          {!isLoading && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200 cursor-pointer hover:bg-gray-200 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </div>
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    let useGray = true;
                    let currentColor = "gray";

                    return table.getRowModel().rows.map((row) => {
                      const natureCell = row.getVisibleCells().find(
                        (cell) =>
                          cell.column.columnDef.header === "Nature" ||
                          cell.column.columnDef.header === "Definition" ||
                          cell.column.columnDef.header === "Actif" ||
                          cell.column.columnDef.header === "Passif"
                      );

                      if (reportType === "CPC" && natureCell) {
                        const cellValue = natureCell.getValue();
                        if (cellValue && typeof cellValue === 'string') {
                          const roman = cellValue.trim().split(".")[0];
                          if (/^[IVXLCDM]+$/.test(roman)) {
                            useGray = !useGray;
                            currentColor = useGray ? "gray" : "orange";
                          }
                        }
                      }
                      if (reportType === 'ESG' && natureCell) {
                        if (natureCell.getValue() === "I. Tableau de formation des R;sultats (T.F.R )")
                          currentColor = "gray";
                        else if (natureCell.getValue() === "II. CAPACITE D'AUTOFINANCEMENT (C.A.F.) - AUTOFINANCEMENT")
                          currentColor = "orange";
                      }
                      if (reportType === 'Actif' && natureCell) {
                        if (["IMMOBILISATIONS EN NON VALEUR (A)", "IMMOBILISATIONS CORPORELLES (C)", "ECARTS DE CONVERSION - ACTIF (E)", "CREANCES DE L'ACTIF CIRCULANT (G)", "ECARTS DE CONVERSION - ACTIF (I)"].includes(natureCell.getValue()))
                          currentColor = "gray";
                        else if (["IMMOBILISATIONS INCORPORELLES (B)", "IMMOBILISATIONS FINANCIERES (D)", "STOCKS (F)", "TITRES ET VALEURS DE PLACEMENT (H)", "TRESORIE ACTIF"].includes(natureCell.getValue()))
                          currentColor = "orange";
                      }
                      if (reportType === 'Passif' && natureCell) {
                        if (["CAPITAUX PROPRES", "DETTES DE FINANCEMENT", "ECARTS DE CONVERSION PASSIF", "AUTRES PROVISIONS POUR RISQUE ET CHARGE            (G)"].includes(natureCell.getValue()))
                          currentColor = "gray";
                        else if (["CAPITAUX PROPRES ASSIMILES", "PROVISIONS DURABLES POUR RISQUES ET CHARGE", "DETTES DU PASSIF CIRCULANT ", "TITRES ET VALEURS DE PLACEMENT (H)", "TRESORIE - PASSIF"].includes(natureCell.getValue()))
                          currentColor = "orange";
                      }

                      const bgClassMap = {
                        gray: "bg-gray-50 hover:bg-gray-200",
                        orange: "bg-orange-50 hover:bg-orange-200",
                      };
                      const rowBgClass = bgClassMap[currentColor];

                      return (
                        <tr key={row.id} className={`transition-colors ${rowBgClass}`}>
                          {row.getVisibleCells().map((cell) => {
                            const value = cell.getValue();
                            const isNumeric = typeof value === "number" || value === null;
                            return (
                              <td
                                key={cell.id}
                                className={`px-4 py-3 text-sm border-b border-gray-100 ${isNumeric ? "text-right" : "text-left"}`}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && table.getFilteredRowModel().rows.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Search className="mx-auto w-12 h-12 text-gray-300 mb-4" />
              <p className="text-lg font-medium">{t('common.no_results')}</p>
              <p className="text-sm">{t('common.try_modifying_search')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


// ---------------------------------------------------------------------------
// HoverNode
// ---------------------------------------------------------------------------
const HoverNode = ({ data }) => {
  const { t } = useTranslation();
  return (
  <div className="tooltip-box bg-gradient-to-br from-orange-400 to-orange-500 border border-orange-300/30 shadow-2xl">
    <div className="text-white font-semibold">
      <span className="font-bold text-gray-600">{t('common.interpretation')}</span> : {data.interpretation}
    </div>
    <div className="text-white font-semibold mb-3">
      <span className="font-bold text-gray-600">{t('common.recommandations')}</span> : {data.recommandations}
    </div>
    <div className="text-white font-semibold">
      <span className="font-bold text-gray-600">{t('common.example')}</span> : {data.example}
    </div>
  </div>
  );
};


// ---------------------------------------------------------------------------
// CollapsibleField
// ---------------------------------------------------------------------------
const CollapsibleField = ({ label, value, isFirst, modelType, category, newSold, fieldId }) => {
  const isReactNode = React.isValidElement(value);
  const isObject = value && typeof value === "object" && !isReactNode;

  if (isReactNode && value.props.children[1].includes("undefined")) return null;
  if (value === undefined || value === null) return null;

  return (
    <div className={`mb-2 ${isFirst ? "border-r pr-5 mr-3" : ""} border-orange-100`}>
      <div className={`flex items-center justify-between cursor-pointer text-xs font-bold ${modelType === "ratio" ? "text-amber-600" : "text-orange-600"}`}>
        <span>{label}:</span>
      </div>
      {isReactNode && (
        <div className="text-xs text-gray-800 break-words mt-1">{value}</div>
      )}
      {!isReactNode && !isObject && fieldId !== "balance" && fieldId !== "new_balance" && fieldId !== "variance" && (
        <div className="text-xs text-gray-800 break-words mt-1">{String(value)}</div>
      )}
      {!isReactNode && !isObject && (fieldId === "balance" || fieldId === "new_balance" || fieldId === "variance") && (
        <div className="text-xs font-extrabold text-black break-words mt-1">
          {String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
        </div>
      )}
    </div>
  );
};


// ---------------------------------------------------------------------------
// SimulationCard  ← loan calculator logic for EC013 / EC054 included
// ---------------------------------------------------------------------------
const SimulationCard = memo(({ data, basesRef, modelType, calculResultsRef, cardRef }) => {
  const { t } = useTranslation();
  const [Clicked, setClicked] = useState(false);
  const [editing, setEditing] = useState(false);
  const [query, setQuery] = useState("");
  const [editingSold, setEditingSold] = useState(false);
  const [value, setValue] = useState("-");
  const inputRef = useRef(null);
  // Loan calculator state (used only for EC013 / EC054)
  const [loanCalculVal, setLoanCalculVal] = useState({ amount: null, interest: null, years: null });

  const handleSave = () => {
    if (data.parentId === 'EC013' || data.parentId === 'EC054') {
      // Loan calculator path
      if (loanCalculVal.amount && loanCalculVal.interest && loanCalculVal.years) {
        const calculResults = calculateResults(loanCalculVal);
        calculResultsRef.current = calculResults;
        basesRef.current[data.parentId] = (
          Math.abs((loanCalculVal.amount + data.SoldeValue)) -
          Number(calculResults.firstYearCapital)
        ).toFixed(2);
        setEditing(false);
        setEditingSold(true);
        setValue(basesRef.current[data.parentId]);
      }
    } else if (inputRef.current) {
      // Standard numeric path
      const val = inputRef.current.value;
      if (val.length > 12) return;
      basesRef.current[data.parentId] = val.trim();
      setEditing(false);
      setEditingSold(true);
      setValue(val);
    }
  };

  const fields = [
    { id: 'name', label: t('common.element_name'), value: t(`elements.${data.parentId}`, { defaultValue: data.nameFr }) },
    { id: 'balance', label: t('common.balance_value'), value: data.SoldeValue },
    { id: 'new_balance', label: t('common.new_balance'), value: data.newSold !== null ? data.newSold : '-' },
    { id: 'formula', label: t('common.formula'), value: data.formula },
  ];

  const getFiltredItemms = () => {
    if (!query) return [];
    return Elements.filter(elem => elem.nameFr.toLowerCase().includes(query.toLowerCase()));
  };
  const filteredData = getFiltredItemms();

  const handleInputFocus = (e) => {
    if (e.code === 'Enter') {
      const source = Elements.find(elem => elem.nameFr.toLowerCase() === query.toLowerCase());
      if (!source) return;
      data.setSource(source.id);
    }
  };

  return (
    <motion.div
      onMouseLeave={() => setClicked(false)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      ref={cardRef}
      className={`relative ${data.eleType === "Source" ? "w-[250px] grid grid-cols-1" : "w-[330px] grid grid-cols-2"} bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans`}
    >
      {/* Search input for root node */}
      {data.isRoot && (
        <div className={`${data.eleType === 'Source' ? "relative" : "absolute w-[20.5rem] -top-[3.67rem]"} z-10`}>
          <input
            type='text'
            className='w-full border border-gray-400 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('common.search_element')}
            onKeyDown={handleInputFocus}
          />
          {filteredData.length > 0 && (
            <ul className='search-dropdown'>
              {filteredData.map((val, i) => (
                <li
                  key={val.nameFr + i}
                  className='px-3 py-2 border-b border-gray-200 last:border-b-0 hover:bg-gray-100 cursor-pointer transition-colors duration-150 text-gray-800'
                  onClick={() => { data.setSource(val.id); data.Selected.current = true; }}
                >
                  {t(`elements.${val.id}`, { defaultValue: val.nameFr })}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Left} className="opacity-0" />

      {/* Node ID badge */}
      {data.eleType !== "Source" && (
        <div className={`absolute ${data.eleType === "Ratio" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-orange-500 to-orange-600"} text-white -top-[0.9rem] right-1/2 w-full text-xl font-bold rounded-lg text-center transform -translate-y-1/2 translate-x-1/2 shadow-sm`}>
          {data.parentId}
        </div>
      )}

      {/* Info button */}
      {data.eleType !== "Source" && data.interpretation && data.recommandations && data.example && (
        <button
          className='absolute right-2 top-2 bg-orange-100 text-orange-700 hover:bg-orange-200 w-10 rounded-md h-6 text-center text-xs font-semibold transition-colors'
          onClick={() => setClicked(true)}
        >
          {t('common.info')}
        </button>
      )}

      {/* Tooltip */}
      {Clicked && (
        <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
          <HoverNode data={data} />
          <div className="tooltip-arrow" />
        </div>
      )}

      {/* Field rows (skip "Nouveau solde" — rendered separately below) */}
      {data.eleType !== "Source" && fields.map((field, idx) => {
        if (field.id === "new_balance") return null;
        if (field.id === 'balance') field.value = Number(field.value).toFixed(0);
        return (
          <div key={idx} className='row-span-2'>
            <CollapsibleField
              label={field.label}
              value={field.value}
              isFirst={idx === 0 || idx === 3}
              modelType={modelType}
              category={data.category}
              newSold={data.newSold}
              fieldId={field.id}
            />
          </div>
        );
      })}

      {/* Editing area */}
      {editing && data.category === "Elément de base" ? (
        <div className="flex flex-col cursor-pointer text-xs font-bold text-blue-600">
          <span>{t('common.new_balance_label')}</span>

          {/* Standard numeric input */}
          {!(data.parentId === 'EC013' || data.parentId === 'EC054') && (
            <input
              type="number"
              defaultValue=""
              ref={inputRef}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="w-24 mt-1 text-xs text-gray-800 border border-gray-300 rounded px-1"
              autoFocus
            />
          )}

          {/* Loan calculator inputs (EC013 / EC054) */}
          {(data.parentId === 'EC013' || data.parentId === 'EC054') && (
            <div>
              {['Amount', 'Interest', 'Years'].map((label, i) => (
                <input
                  key={i}
                  type="number"
                  className="w-24 mt-1 text-xs text-gray-800 border border-gray-300 rounded px-1 block"
                  placeholder={t(`common.${label.toLowerCase()}`)}
                  onBlur={(e) =>
                    setLoanCalculVal(prev => ({ ...prev, [label.toLowerCase()]: Number(e.target.value) }))
                  }
                />
              ))}
              <button
                className='absolute right-4 bottom-[4.5rem] font-medium px-2 text-2xl bg-indigo-100 text-indigo-700 rounded'
                onClick={handleSave}
              >
                =
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col cursor-pointer text-xs font-bold text-blue-600">
          {/* "Nouveau solde" display */}
          {data.eleType !== "Source" && (
            <CollapsibleField
              label={fields[2].label}
              value={
                data.category === "Elément de base" && (data.newSold === null || editingSold)
                  ? String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  : fields[2].value === '-'
                    ? fields[2].value
                    : typeof fields[2].value === 'number'
                      ? fields[2].value.toFixed(0)
                      : fields[2].value
              }
              isFirst={false}
              modelType={modelType}
              category={data.category}
              newSold={data.newSold}
              fieldId="new_balance"
            />
          )}
          {/* Edit pencil button */}
          {data.category === "Elément de base" && (
            <button onClick={() => setEditing(true)}>
              <Pencil size={14} className="absolute bottom-11 right-10 text-gray-500 hover:text-gray-700" />
            </button>
          )}
        </div>
      )}

      {/* Variance display */}
      {data.eleType !== "Source" && (
        <CollapsibleField
          label={t('common.variance')}
          value={
            ((fields[2].value / fields[1].value) - 1).toFixed(3) !== 'NaN' &&
            fields[1].value !== 0 &&
            fields[2].value !== null
              ? Number((((fields[2].value / fields[1].value) - 1) * 100).toFixed(3)).toString() + '%'
              : "-"
          }
          isFirst={false}
          modelType={modelType}
          category={data.category}
          newSold={data.newSold}
          fieldId="variance"
        />
      )}

      {data.eleType === "Source" && <div className="text-base text-gray-700">{data.label}</div>}

      {/* Drill-down button */}
      {data.hasChildren && (
        <button
          onClick={data.onDrill}
          className="absolute bottom-2 right-2 text-sm bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg px-3 py-1 font-medium transition-all shadow-sm"
        >
          {data.expanded ? "−" : `${data.childrenNum} +`}
        </button>
      )}

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </motion.div>
  );
});


// ---------------------------------------------------------------------------
// CustomNode  (Ratio / Élément comptable modes)
// ---------------------------------------------------------------------------
const CustomNode = memo(({ data, basesRef, modelType }) => {
  const { t } = useTranslation();
  const [Clicked, setClicked] = useState(false);
  const SourceArrays = {
    "ratio": ['Rind', 'Rges', 'Rliq', 'Rend', 'Rsol', 'Rren'],
    "élément comptable": ['ECBA', 'ECBP', 'ECPC', 'ESG'],
  };

  const fields = [
    {
      id: 'name',
      label: t('common.designation'),
      value: (
        <>
          <span className="font-semibold">{t(`elements.${data.parentId}`, { defaultValue: data.nameFr })}</span>
          {` : ${data.signification}`}
        </>
      ),
    },
    { id: 'method', label: t('common.calculation_method'), value: data.method },
    { id: 'reports', label: t('common.reports_containing_item'), value: data.Reports },
    { id: 'balance', label: t('common.balance_value'), value: String(data.SoldeValue).replace(/\B(?=(\d{3})+(?!\d))/g, ",") },
  ];

  return (
    <motion.div
      onMouseLeave={() => setClicked(false)}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={`relative ${data.eleType === "Source" ? "w-[250px]" : "w-[520px] grid grid-cols-2"} bg-white border border-gray-200 rounded-xl p-4 shadow-sm font-sans`}
    >
      {data.eleType === "Source" && (
        <select
          value={data.Source || ""}
          onChange={(e) => { data.setSource(e.target.value); data.Selected.current = true; }}
        >
          <option value="" disabled>{modelType === "élément comptable" ? t('reports.select_report') : t('reports.select_category')}</option>
          {SourceArrays[modelType].map(key => {
            const element = Elements.find(elem => elem.id === key);
            return <option key={key} value={key}>{element.nameFr}</option>;
          })}
        </select>
      )}

      <Handle type="target" position={Position.Left} className="opacity-0" />

      <div className={`absolute ${data.eleType === "Ratio" ? "bg-gradient-to-r from-amber-500 to-orange-500" : "bg-gradient-to-r from-blue-500 to-blue-600"} text-white -top-[0.9rem] right-1/2 w-20 text-xl font-bold rounded-lg text-center transform -translate-y-1/2 translate-x-1/2 shadow-sm`}>
        {data.parentId}
      </div>

      {data.eleType !== "Source" && data.interpretation && data.recommandations && data.example && (
        <button
          className='absolute right-2 top-2 bg-orange-100 text-orange-700 hover:bg-orange-200 w-10 rounded-md h-6 text-center text-xs font-semibold transition-colors'
          onClick={() => setClicked(true)}
        >
          info
        </button>
      )}

      {Clicked && (
        <div className="absolute bottom-full right-[30px] translate-x-1/2 translate-y-4 mb-3 z-[9999]">
          <HoverNode data={data} />
          <div className="tooltip-arrow" />
        </div>
      )}

      {data.eleType !== "Source" && fields.map((field, idx) => (
        <div key={idx} className={idx === 0 && fields[1]?.value?.length < 2 * fields[0]?.value?.props?.children[1]?.length / 3 ? "row-span-3" : ""}>
          <CollapsibleField
            label={field.label}
            value={field.value}
            isFirst={idx === 0}
            modelType={modelType}
            category={data.category}
            newSold={data.newSold}
            fieldId={field.id}
          />
        </div>
      ))}

      {data.hasChildren && (
        <button
          onClick={data.onDrill}
          className="absolute bottom-2 right-2 text-sm bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100 rounded-lg px-3 py-1 font-medium transition-all shadow-sm"
        >
          {data.expanded ? "−" : `${data.childrenNum} +`}
        </button>
      )}

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </motion.div>
  );
});


// ---------------------------------------------------------------------------
// Edge defaults
// ---------------------------------------------------------------------------
const defaultEdgeOptions = {
  type: 'smoothstep',
  style: { strokeWidth: 2 },
};


// ---------------------------------------------------------------------------
// KPIDiagram  (main component)
// ---------------------------------------------------------------------------
const KPIDiagram = memo(({ initialMode }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { 
    nodesState, edgesState, sourceState, updateNodes, updateEdges, updateSource,
    newNodesRef, edgesRef, expandedNodesRef, expandedNodesArrayRef, 
    lastPrentId, basesRef, calculResultsRef 
  } = useDiagram();

  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState(initialMode || "simulation");
  const [Source, setSource] = useState(sourceState[initialMode || "simulation"] || '');
  
  const [SourceTable, setSourceTable] = useState('');
  const [reset, setReset] = useState(false);
  const [Simulate, setSimulate] = useState(false);
  const tableRef = useRef(null);
  const cardRef = useRef(null);
  const [tableCoords, setTableCoords] = useState({ x: 0, y: 0, width: 0 });
  const SelectTitle = useRef('');
  const Selected = useRef(false);
  
  const [level, setLevel] = useState(0);
  const reactFlowWrapper = useRef(null);
  const reactFlowInstance = useRef(null);
  const chilLimit = useRef('');
  const [isOpen, setIsOpen] = useState(false);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(nodesState[modelType] || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(edgesState[modelType] || []);
  const [hasData, setHasData] = useState(true);

  // Sync state changes back to context for persistence
  useEffect(() => {
    if (nodes.length > 0) updateNodes(modelType, nodes);
  }, [nodes, modelType]);

  useEffect(() => {
    if (edges.length > 0) updateEdges(modelType, edges);
  }, [edges, modelType]);

  useEffect(() => {
    updateSource(modelType, Source);
  }, [Source, modelType]);

  // Sync initialMode prop
  useEffect(() => {
    if (initialMode) {
      const mode = initialMode.toLowerCase();
      setModelType(mode);
      setSource('');
      SelectTitle.current = mode === "élément comptable" ? t('reports.select_report') : t('reports.select_category');

      // Load saved state for the new mode
      setSource(sourceState[mode] || '');
      setNodes(nodesState[mode] || []);
      setEdges(edgesState[mode] || []);
    }
  }, [initialMode, t]);

  // nodeTypes — pass calculResultsRef to SimulationCard
  const nodeTypes = useMemo(() => ({
    customNode: (props) => {
      if (modelType === "simulation") {
        return (
          <SimulationCard
            {...props}
            basesRef={basesRef}
            calculResultsRef={calculResultsRef}
            modelType={modelType}
            cardRef={cardRef}
          />
        );
      }
      return <CustomNode {...props} basesRef={basesRef} modelType={modelType} />;
    },
  }), [basesRef, modelType]);

  // Tree layout
  const calculateTreeLayout = useCallback(() => {
    const nodeMap = new Map(newNodesRef.current[modelType].map(node => [node.id, node]));
    const visitedNodes = new Set();
    const horizontalSpacing = modelType !== "simulation" ? 700 : 500;
    const verticalSpacing = modelType !== "simulation" ? 350 : 250;

    const positionSubtree = (nodeId, x, y) => {
      if (visitedNodes.has(nodeId)) return { width: 0, height: 0 };
      const node = nodeMap.get(nodeId);
      if (!node) return { width: 0, height: 0 };
      visitedNodes.add(nodeId);

      const children = edgesRef.current[modelType]
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target)
        .filter(childId => nodeMap.has(childId));

      if (children.length === 0) {
        node.position = { x, y };
        return { width: horizontalSpacing, height: verticalSpacing };
      }

      let totalChildHeight = 0;
      for (const childId of children) {
        const ch = positionSubtree(childId, x + horizontalSpacing, y + totalChildHeight);
        totalChildHeight += ch.height;
      }

      node.position = { x, y: y + (totalChildHeight - verticalSpacing) / 2 };
      return { width: horizontalSpacing, height: Math.max(totalChildHeight, verticalSpacing) };
    };

    const rootNodes = newNodesRef.current[modelType].filter(
      node => !edgesRef.current[modelType].some(edge => edge.target === node.id)
    );
    let currentY = 0;
    rootNodes.forEach(rootNode => {
      const size = positionSubtree(rootNode.id, 50, currentY);
      currentY += size.height + 100;
    });
  }, [modelType]);

  const focusOnNodeAndChildren = useCallback((parentNodeId) => {
    if (!reactFlowInstance.current) return;
    const parentNode = newNodesRef.current[modelType].find(n => n.id === parentNodeId);
    if (!parentNode) {
      reactFlowInstance.current.fitView({ padding: 1, duration: 500, maxZoom: 1 });
      return;
    }
    if (parentNode.data.eleType === 'Source' && !parentNode.data.expanded) {
      reactFlowInstance.current.fitView({ padding: 0.4, includeHiddenNodes: false, maxZoom: 2, duration: 800 });
      return;
    }

    const childrenIds = edgesRef.current[modelType].filter(e => e.source === parentNodeId).map(e => e.target);
    const allNodes = [parentNode, ...newNodesRef.current[modelType].filter(n => childrenIds.includes(n.id))];
    if (allNodes.length === 0) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    allNodes.forEach(node => {
      const nw = modelType === "simulation" ? 300 : 400;
      const nh = modelType === "simulation" ? 200 : 250;
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + nw);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + nh);
    });

    const pad = 100;
    const centerX = (minX - pad + maxX + pad) / 2;
    const centerY = (minY - pad + maxY + pad) / 2;
    const vw = reactFlowWrapper.current.clientWidth;
    const vh = reactFlowWrapper.current.clientHeight;
    const zoom = Math.min(vw / (maxX - minX + pad * 2), vh / (maxY - minY + pad * 2), 1.5);

    reactFlowInstance.current.setViewport(
      { x: vw / 2 - centerX * zoom, y: vh / 2 - centerY * zoom, zoom },
      { duration: 800 }
    );
  }, [modelType]);

  // Fetch helpers
  const fetchNode = async (nodeId, mt, bRef, expandedNodes = []) => {
    try {
      const res = await api.post(`/node/${nodeId}`, {
        modelType: mt,
        basesRef: bRef.current,
        expandedNodes,
      });
      return res.data.node;
    } catch (error) {
      console.error('Error fetching node:', error);
      toast.error(t('common.error_fetching_node') || "Erreur lors de la récupération du nœud");
      return null;
    }
  };

  // fetchCalculation now receives calculResultsRef and forwards it to the API
  const fetchCalculation = async (bRef, expandedNodes = [], calcRef) => {
    try {
      const expandedArray = expandedNodes.map(n => n.trim());
      const res = await api.post(`/calculation`, {
        basesRef: bRef.current,
        calculResultsRef: calcRef.current,   // ← loan results forwarded to backend
        expandedNodes: expandedArray,
      });
      return res.data;
    } catch (err) {
      if (err.response) {
        console.error("Error fetching calculation:", err.response.data);
        toast.error(err.response.data.message || "Une erreur est survenue");
      } else {
        console.error("Unexpected error:", err);
        toast.error("Erreur de connexion au serveur");
      }
      setLoading(false);
      return null;
    }
  };

  // Remove descendants when collapsing a node
  const removeDescendants = useCallback((parentId) => {
    const toRemove = new Set();
    const stack = [parentId];

    while (stack.length > 0) {
      const current = stack.pop();
      const children = edgesRef.current[modelType].filter(e => e.source === current).map(e => e.target);
      for (const childId of children) {
        const validParents = edgesRef.current[modelType]
          .filter(e => e.target === childId && e.source !== current)
          .filter(par => {
            let source = par.source;
            while (source) {
              const pe = edgesRef.current[modelType].find(e => e.target === source);
              if (!pe) return true;
              if (source === current || toRemove.has(source)) return false;
              source = pe.source;
            }
            return true;
          });
        if (validParents.length === 0) { stack.push(childId); toRemove.add(childId); }
      }
    }

    newNodesRef.current[modelType] = newNodesRef.current[modelType].filter(n => !toRemove.has(n.id));
    edgesRef.current[modelType] = edgesRef.current[modelType].filter(
      e => !toRemove.has(e.source) && !toRemove.has(e.target)
    );
    expandedNodesRef.current[modelType].delete(parentId);
    expandedNodesArrayRef.current[modelType] = expandedNodesArrayRef.current[modelType].filter(id => id !== parentId);
    newNodesRef.current[modelType] = newNodesRef.current[modelType].map(n =>
      n.id === parentId ? { ...n, data: { ...n.data, expanded: false } } : n
    );
    calculateTreeLayout();
  }, [calculateTreeLayout, modelType]);

  // Drill-down / collapse handler
  const handleDrill = useCallback(async (nodeId, isRoot = false, mt, bRef) => {
    const isExpanded = expandedNodesRef.current[mt].has(nodeId);
    if (isExpanded) {
      removeDescendants(nodeId);
      setNodes([...newNodesRef.current[mt]]);
      setEdges([...edgesRef.current[mt]]);
      setTimeout(() => focusOnNodeAndChildren(nodeId), 100);
      return;
    }

    const node = await fetchNode(nodeId, mt, bRef, expandedNodesArrayRef.current[mt]);
    if (!node || !node.childrenData || chilLimit.current.includes(node.parentId)) return;

    const entries = Object.entries(node.childrenData);

    const generateColor = (id) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) { hash = ((hash << 5) - hash) + id.charCodeAt(i); hash = hash & hash; }
      return `hsl(${Math.abs(hash) % 360}, 70%, 60%)`;
    };

    entries.forEach(([childId, childLabel]) => {
      edgesRef.current[mt].push({
        id: `e-${nodeId}-${childId}`,
        source: nodeId,
        target: childId,
        style: { stroke: generateColor(nodeId), strokeWidth: 2 },
        animated: false,
      });
      newNodesRef.current[mt].push({
        id: childId,
        type: 'customNode',
        position: { x: 0, y: 0 },
        data: {
          id: childId,
          ...childLabel,
          sign: childLabel.childSign,
          expanded: false,
          onDrill: () => handleDrill(childId, false, mt, bRef),
          Source,
          setSource,
          Selected,
        },
      });
    });

    expandedNodesRef.current[mt].add(nodeId);
    if (!expandedNodesArrayRef.current[mt].includes(node.childrenIds)) {
      expandedNodesArrayRef.current[mt].push(...node.childrenIds);
    }
    newNodesRef.current[mt] = newNodesRef.current[mt].map(n =>
      n.id === nodeId ? { ...n, data: { ...n.data, expanded: true } } : n
    );

    calculateTreeLayout();

    const uniqueNodes = Array.from(new Map(newNodesRef.current[mt].map(n => [n.id, n])).values());
    const uniqueEdges = Array.from(new Map(edgesRef.current[mt].map(e => [e.id, e])).values());
    setNodes(uniqueNodes);
    setEdges(uniqueEdges);

    setTimeout(() => {
      focusOnNodeAndChildren(nodeId);
      lastPrentId.current[mt] = nodeId;
    }, 100);
  }, [level, calculateTreeLayout, removeDescendants, Source, focusOnNodeAndChildren]);

  const onInit = useCallback((rfi) => { reactFlowInstance.current = rfi; }, []);

  // Simulate — forwards calculResultsRef to the API
  const simulate = async () => {
    setLoading(true);
    const calculation = await fetchCalculation(basesRef, expandedNodesArrayRef.current[modelType], calculResultsRef);
    if (!calculation) { setLoading(false); return; }

    if (calculation.success) {
      for (let i = 0; i < newNodesRef.current[modelType].length; i++) {
        const node = newNodesRef.current[modelType][i];
        const newNode = await fetchNode(node.id, modelType, basesRef);
        newNodesRef.current[modelType][i] = {
          ...node,
          position: node.position,
          data: { ...node.data, ...newNode },
        };
      }
      setNodes([...newNodesRef.current[modelType]]);
    }

    setSimulate(prev => !prev);
    setReset(false);
    setLoading(false);
  };

  // Reset — also clears calculResultsRef
  const handleReset = async () => {
    try {
      await api.get(`/reset/`);
      basesRef.current = {};
      calculResultsRef.current = {};                       // ← clear loan results
      expandedNodesArrayRef.current[modelType] = [];
      newNodesRef.current[modelType] = [];
      edgesRef.current[modelType] = [];
      expandedNodesRef.current[modelType].clear();
      setEdges([]);
      setNodes([]);
      setReset(true);
      setIsOpen(false);
      loadRoot(true);
    } catch (error) {
      console.error(error.message);
      toast.error(t('common.error_reset') || "Erreur lors de la réinitialisation");
    }
  };

  useEffect(() => {
    const checkData = async () => {
      try {
        const response = await api.get('/check-data');
        setHasData(response.data.hasData);
      } catch (err) {
        console.error("Presence check failed", err);
        // This is a background check, maybe don't toast for this one as it might be annoying on mount
      }
    };
    checkData();
  }, []);

  useEffect(() => {
    if (modelType === 'simulation' && Source) setSourceTable(Source);
  }, [Source]);

  const loadRoot = async (restart = false) => {
    // If we already have nodes for this mode in our persisted state,
    // just sync them to the current ReactFlow state and skip fetching.
    if (newNodesRef.current[modelType].length > 0) {
      setNodes([...newNodesRef.current[modelType]]);
      setEdges([...edgesRef.current[modelType]]);
      return;
    }

    if (!Source) {
        newNodesRef.current[modelType].push({
          id: 'firstNode',
          type: 'customNode',
          position: { x: 50, y: 200 },
          data: {
            id: '',
            Source,
            isRoot: true,
            setSource,
            Selected,
            SelectTitle: SelectTitle.current,
            eleType: 'Source',
          },
        });
      if (newNodesRef.current[modelType].length <= 1 && reactFlowInstance.current) {
        setTimeout(() => {
          reactFlowInstance.current.fitView({ padding: 1, includeHiddenNodes: false, maxZoom: 1, duration: restart ? 500 : 200 });
        }, 100);
      }
      setNodes(newNodesRef.current[modelType]);
      setEdges(edgesRef.current[modelType]);
      return;
    }

    const root = await fetchNode(Source, modelType, basesRef, expandedNodesArrayRef.current[modelType]);
    if (!root) return;
    if (root.childrenLimit) chilLimit.current = root.childrenLimit;

    const rootId = root.parentId || Source;
    newNodesRef.current[modelType].push({
      id: rootId,
      type: 'customNode',
      position: { x: 50, y: 200 },
      data: {
        label: root.nameFr || 'Root Node',
        id: rootId,
        hasChildren: true,
        isRoot: true,
        childrenNum: Object.entries(root.childrenData || {}).length,
        expanded: false,
        onDrill: () => handleDrill(rootId, true, modelType, basesRef),
        Source,
        setSource,
        Selected,
        ...root,
      },
    });

    setNodes([...newNodesRef.current[modelType]]);
    setEdges([...edgesRef.current[modelType]]);

    if (reactFlowInstance.current) {
      setTimeout(() => {
        reactFlowInstance.current.fitView({ padding: 1, includeHiddenNodes: false, maxZoom: 1, duration: restart ? 500 : 200 });
      }, 100);
    }
  };

  useEffect(() => {
    if (tableRef.current) {
      const rect = tableRef.current.getBoundingClientRect();
      setTableCoords({ x: rect.x, y: rect.y, width: rect.width });
    }
  }, [isOpen, tableRef]);

  useEffect(() => {
    if (reactFlowInstance.current && cardRef.current) {
      reactFlowInstance.current.fitView({ padding: 1, includeHiddenNodes: false, maxZoom: 1, duration: 500 });
      const { x, y, zoom } = reactFlowInstance.current.getViewport();
      const zoomUse = zoom > 0.6 ? 0.6 : zoom;
      reactFlowInstance.current.setViewport(
        { x: isOpen ? x + tableCoords.width * zoomUse : x - tableCoords.width * zoomUse, y, zoom },
        { duration: 500 }
      );
    }
  }, [isOpen, tableCoords.x, tableCoords.y]);

  useEffect(() => {
    setIsOpen(false);
    if (modelType !== "reports" && modelType !== "loan calculator") {
      // Only clear and reload if we explicitly selected a new source
      // or if the diagram for this mode is completely empty.
      if (Selected.current || newNodesRef.current[modelType].length === 0) {
        if (Selected.current) {
          expandedNodesArrayRef.current[modelType] = [];
          newNodesRef.current[modelType] = [];
          edgesRef.current[modelType] = [];
          expandedNodesRef.current[modelType].clear();
          Selected.current = false;
        }
        loadRoot();
      } else {
        // Just sync and focus if we already have data
        setNodes([...newNodesRef.current[modelType]]);
        setEdges([...edgesRef.current[modelType]]);
        setTimeout(() => {
          focusOnNodeAndChildren(lastPrentId.current[modelType]);
        }, 50);
      }
    }
  }, [Source, modelType]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="relative" style={{ width: '100%', height: 'calc(100vh - 120px)' }} ref={reactFlowWrapper}>

      {modelType !== 'reports' && modelType !== "loan calculator" && (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          deleteKeyCode={null}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 2.8 }}
          onInit={onInit}
          defaultEdgeOptions={defaultEdgeOptions}
        >
          <Background />
          <Controls />

          {/* Simulate / Reset controls */}
          {modelType === "simulation" && (
            <div className="absolute top-6 right-6 flex gap-4 z-50 bg-white/40 backdrop-blur-md p-2 rounded-2xl border border-white/40 shadow-xl">
              <button
                className='btn-primary flex items-center gap-2'
                onClick={simulate}
                disabled={loading}
              >
                {loading
                  ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  : <Play size={18} fill="currentColor" />}
                {loading ? 'Simulation...' : 'Simulate'}
              </button>
              <button className='btn-danger flex items-center gap-2' onClick={handleReset}>
                <RotateCcw size={18} /> Reset
              </button>
            </div>
          )}

          {/* Side panel (simulation tables) */}
          {modelType === "simulation" && (
            <div className="absolute top-1/4 left-1 flex">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 bg-orange-500 z-[1000] text-white rounded-r-xl shadow-lg hover:bg-orange-600 transition-all duration-300"
              >
                {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
              </button>

              <div
                ref={tableRef}
                className={`table-dropdown z-[100] w-5/6 bg-white shadow-lg rounded-l-lg transition-all duration-300 transform ${isOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-full"}`}
              >
                <h3 className="text-xl bg-gradient-to-r from-orange-100 to-orange-200 text-center font-semibold text-gray-700 border-b p-2">
                  Simulation Table
                </h3>
                <SimulationTable Source={SourceTable} basesRef={basesRef} setSource={setSource} reset={reset} />

                <h3 className="text-xl bg-gradient-to-r from-orange-200 to-orange-300 text-center font-semibold text-gray-700 border-b p-2">
                  Affected Elements Table
                </h3>
                <AffectedElementsTable
                  Source={SourceTable}
                  expandedNodes={expandedNodesArrayRef.current[modelType]}
                  setSource={setSource}
                  reset={reset}
                  simulate={Simulate}
                />
              </div>
            </div>
          )}

          {/* Dev debug panel */}
          {process.env.REACT_APP_NODE_ENV === 'development' && (
            <div className="absolute left-5 bottom-5 bg-black bg-opacity-70 text-white p-3 rounded-md text-xs z-50">
              <div>Expanded Nodes: {expandedNodesArrayRef.current[modelType].length}</div>
              <div>[{expandedNodesArrayRef.current[modelType].join(', ')}]</div>
            </div>
          )}

          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 bg-black bg-opacity-40 flex flex-col items-center justify-center z-50">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
              <p className="text-white mt-4 text-lg font-medium">Chargement des éléments...</p>
            </div>
          )}
        </ReactFlow>
      )}

      {modelType === "reports" && <TableExample />}
      {modelType === "loan calculator" && <LoanCalculator />}
    </div>
  );
});

export default KPIDiagram;