// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import type * as jotai from "jotai";
import type * as rxjs from "rxjs";

declare global {
    type GlobalAtomsType = {
        windowId: jotai.Atom<string>; // readonly
        clientId: jotai.Atom<string>; // readonly
        client: jotai.Atom<Client>; // driven from WOS
        uiContext: jotai.Atom<UIContext>; // driven from windowId, activetabid, etc.
        waveWindow: jotai.Atom<WaveWindow>; // driven from WOS
        workspace: jotai.Atom<Workspace>; // driven from WOS
        settingsConfigAtom: jotai.PrimitiveAtom<SettingsConfigType>; // driven from WOS, settings -- updated via WebSocket
        tabAtom: jotai.Atom<Tab>; // driven from WOS
        activeTabId: jotai.Atom<string>; // derrived from windowDataAtom
        isFullScreen: jotai.PrimitiveAtom<boolean>;
        cmdShiftDelayAtom: jotai.PrimitiveAtom<boolean>;
    };

    type TabLayoutData = {
        blockId: string;
    };

    type Bounds = {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    type ElectronApi = {
        getIsDev(): boolean;
        getCursorPoint: () => Electron.Point;

        getPlatform: () => NodeJS.Platform;
        getEnv: (varName: string) => string;

        showContextMenu: (menu: ElectronContextMenuItem[], position: { x: number; y: number }) => void;
        onContextMenuClick: (callback: (id: string) => void) => void;
        onNavigate: (callback: (url: string) => void) => void;
        onIframeNavigate: (callback: (url: string) => void) => void;
        downloadFile: (path: string) => void;
        openExternal: (url: string) => void;
        onFullScreenChange: (callback: (isFullScreen: boolean) => void) => void;
    };

    type ElectronContextMenuItem = {
        id: string; // unique id, used for communication
        label: string;
        role?: string; // electron role (optional)
        type?: "separator" | "normal" | "submenu";
        submenu?: ElectronContextMenuItem[];
    };

    type ContextMenuItem = {
        label?: string;
        type?: "separator" | "normal" | "submenu";
        role?: string; // electron role (optional)
        click?: () => void; // not required if role is set
        submenu?: ContextMenuItem[];
    };

    type KeyPressDecl = {
        mods: {
            Cmd?: boolean;
            Option?: boolean;
            Shift?: boolean;
            Ctrl?: boolean;
            Alt?: boolean;
            Meta?: boolean;
        };
        key: string;
        keyType: string;
    };

    interface WaveKeyboardEvent {
        type: string;
        /**
         * Equivalent to KeyboardEvent.key.
         */
        key: string;
        /**
         * Equivalent to KeyboardEvent.code.
         */
        code: string;
        /**
         * Equivalent to KeyboardEvent.shiftKey.
         */
        shift: boolean;
        /**
         * Equivalent to KeyboardEvent.controlKey.
         */
        control: boolean;
        /**
         * Equivalent to KeyboardEvent.altKey.
         */
        alt: boolean;
        /**
         * Equivalent to KeyboardEvent.metaKey.
         */
        meta: boolean;
        /**
         * cmd is special, on mac it is meta, on windows it is alt
         */
        cmd: boolean;
        /**
         * option is special, on mac it is alt, on windows it is meta
         */
        option: boolean;

        repeat: boolean;
        /**
         * Equivalent to KeyboardEvent.location.
         */
        location: number;
    }

    type SubjectWithRef<T> = rxjs.Subject<T> & { refCount: number; release: () => void };

    type HeaderElem = HeaderIconButton | HeaderText | HeaderInput | HeaderDiv | HeaderTextButton;

    type HeaderIconButton = {
        elemtype: "iconbutton";
        icon: string;
        className?: string;
        title?: string;
        click?: (e: React.MouseEvent<any>) => void;
        longClick?: (e: React.MouseEvent<any>) => void;
    };

    type HeaderTextButton = {
        elemtype: "textbutton";
        text: string;
        className?: string;
        onClick?: (e: React.MouseEvent<any>) => void;
    };

    type HeaderText = {
        elemtype: "text";
        text: string;
    };

    type HeaderInput = {
        elemtype: "input";
        value: string;
        className?: string;
        isDisabled?: boolean;
        ref?: React.MutableRefObject<HTMLInputElement>;
        onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
        onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
        onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
        onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    };

    type HeaderDiv = {
        elemtype: "div";
        className?: string;
        children: HeaderElem[];
        onMouseOver?: (e: React.MouseEvent<any>) => void;
        onMouseOut?: (e: React.MouseEvent<any>) => void;
    };

    interface ViewModel {
        viewIcon?: jotai.Atom<string | HeaderIconButton>;
        viewName?: jotai.Atom<string>;
        viewText?: jotai.Atom<string | HeaderElem[]>;
        preIconButton?: jotai.Atom<HeaderIconButton>;
        endIconButtons?: jotai.Atom<HeaderIconButton[]>;
        blockBg?: jotai.Atom<MetaType>;

        onBack?: () => void;
        onForward?: () => void;
        onSearchChange?: (text: string) => void;
        onSearch?: (text: string) => void;
        getSettingsMenuItems?: () => ContextMenuItem[];
        giveFocus?: () => boolean;
    }

    // jotai doesn't export this type :/
    type Loadable<T> = { state: "loading" } | { state: "hasData"; data: T } | { state: "hasError"; error: unknown };
}

export {};
