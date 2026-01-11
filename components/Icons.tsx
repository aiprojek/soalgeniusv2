import React from 'react';

type IconProps = { className?: string };

export const PlusIcon = ({ className }: IconProps) => <i className={`bi bi-plus-lg ${className || ''}`}></i>;
export const TrashIcon = ({ className }: IconProps) => <i className={`bi bi-trash3-fill ${className || ''}`}></i>;
export const PrinterIcon = ({ className }: IconProps) => <i className={`bi bi-printer-fill ${className || ''}`}></i>;
export const DownloadIcon = ({ className }: IconProps) => <i className={`bi bi-download ${className || ''}`}></i>;
export const EditIcon = ({ className }: IconProps) => <i className={`bi bi-pencil-fill ${className || ''}`}></i>;
export const CopyIcon = ({ className }: IconProps) => <i className={`bi bi-copy ${className || ''}`}></i>;
export const ShuffleIcon = ({ className }: IconProps) => <i className={`bi bi-shuffle ${className || ''}`}></i>;
export const ChevronLeftIcon = ({ className }: IconProps) => <i className={`bi bi-chevron-left ${className || ''}`}></i>;
export const SaveIcon = ({ className }: IconProps) => <i className={`bi bi-floppy-fill ${className || ''}`}></i>;
export const CheckIcon = ({ className }: IconProps) => <i className={`bi bi-check-circle-fill ${className || ''}`}></i>;
export const UndoIcon = ({ className }: IconProps) => <i className={`bi bi-arrow-counterclockwise ${className || ''}`}></i>;
export const RedoIcon = ({ className }: IconProps) => <i className={`bi bi-arrow-clockwise ${className || ''}`}></i>;

// Icons for Toast notifications
export const ErrorIcon = ({ className }: IconProps) => <i className={`bi bi-x-circle-fill ${className || ''}`}></i>;
export const InfoIcon = ({ className }: IconProps) => <i className={`bi bi-info-circle-fill ${className || ''}`}></i>;

// New Icons for Sidebar and header
export const BurgerMenuIcon = ({ className }: IconProps) => <i className={`bi bi-list ${className || ''}`}></i>;
export const CloseIcon = ({ className }: IconProps) => <i className={`bi bi-x-lg ${className || ''}`}></i>;
export const ArchiveIcon = ({ className }: IconProps) => <i className={`bi bi-archive-fill ${className || ''}`}></i>;
export const BankIcon = ({ className }: IconProps) => <i className={`bi bi-journal-richtext ${className || ''}`}></i>;
export const BackupIcon = ({ className }: IconProps) => <i className={`bi bi-cloud-arrow-up-fill ${className || ''}`}></i>;
export const RestoreIcon = ({ className }: IconProps) => <i className={`bi bi-cloud-arrow-down-fill ${className || ''}`}></i>;
export const SettingsIcon = ({ className }: IconProps) => <i className={`bi bi-gear-fill ${className || ''}`}></i>;
export const HelpIcon = ({ className }: IconProps) => <i className={`bi bi-question-circle-fill ${className || ''}`}></i>;

// Icons for Preview View
export const ZoomInIcon = ({ className }: IconProps) => <i className={`bi bi-zoom-in ${className || ''}`}></i>;
export const ZoomOutIcon = ({ className }: IconProps) => <i className={`bi bi-zoom-out ${className || ''}`}></i>;

// Icons for Rich Text Editor Toolbar
export const BoldIcon = ({ className }: IconProps) => <i className={`bi bi-type-bold ${className || ''}`}></i>;
export const ItalicIcon = ({ className }: IconProps) => <i className={`bi bi-type-italic ${className || ''}`}></i>;
export const UnderlineIcon = ({ className }: IconProps) => <i className={`bi bi-type-underline ${className || ''}`}></i>;
export const AlignLeftIcon = ({ className }: IconProps) => <i className={`bi bi-text-left ${className || ''}`}></i>;
export const AlignCenterIcon = ({ className }: IconProps) => <i className={`bi bi-text-center ${className || ''}`}></i>;
export const AlignRightIcon = ({ className }: IconProps) => <i className={`bi bi-text-right ${className || ''}`}></i>;
export const JustifyIcon = ({ className }: IconProps) => <i className={`bi bi-justify ${className || ''}`}></i>;
export const TextColorIcon = ({ className }: IconProps) => <i className={`bi bi-palette-fill ${className || ''}`}></i>;

// Icon for Bank Soal
export const BookmarkPlusIcon = ({ className }: IconProps) => <i className={`bi bi-bookmark-plus-fill ${className || ''}`}></i>;

// Icons for Archive View Search/Filter
export const FunnelIcon = ({ className }: IconProps) => <i className={`bi bi-funnel-fill ${className || ''}`}></i>;
export const SearchIcon = ({ className }: IconProps) => <i className={`bi bi-search ${className || ''}`}></i>;

// Icons for Help View
export const CoffeeIcon = ({ className }: IconProps) => <i className={`bi bi-cup-hot-fill ${className || ''}`}></i>;
export const GithubIcon = ({ className }: IconProps) => <i className={`bi bi-github ${className || ''}`}></i>;
export const DiscussionIcon = ({ className }: IconProps) => <i className={`bi bi-telegram ${className || ''}`}></i>;

// Icons for Column Layout
export const CardTextIcon = ({ className }: IconProps) => <i className={`bi bi-card-text ${className || ''}`}></i>;
export const LayoutSplitIcon = ({ className }: IconProps) => <i className={`bi bi-layout-split ${className || ''}`}></i>;

// Icons for Dropbox Sync
export const DropboxIcon = ({ className }: IconProps) => <i className={`bi bi-dropbox ${className || ''}`}></i>;
export const CloudUploadIcon = ({ className }: IconProps) => <i className={`bi bi-cloud-upload-fill ${className || ''}`}></i>;
export const CloudDownloadIcon = ({ className }: IconProps) => <i className={`bi bi-cloud-download-fill ${className || ''}`}></i>;
export const CloudCheckIcon = ({ className }: IconProps) => <i className={`bi bi-cloud-check-fill ${className || ''}`}></i>;

// Icons for AI Features
export const StarsIcon = ({ className }: IconProps) => <i className={`bi bi-stars ${className || ''}`}></i>;
export const RobotIcon = ({ className }: IconProps) => <i className={`bi bi-robot ${className || ''}`}></i>;