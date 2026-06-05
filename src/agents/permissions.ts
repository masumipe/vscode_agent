import { ConfigService } from '../services/configService';

export enum AgentPermission {
    ReadEditor = 'readEditor',
    ReadTerminal = 'readTerminal',
    ReadFolder = 'readFolder',
    WriteFile = 'writeFile',
    DeleteFile = 'deleteFile',
    InsertCode = 'insertCode',
    RunCode = 'runCode',
    TestCode = 'testCode',
    DebugCode = 'debugCode',
    BrowseWeb = 'browseWeb',
    ExecuteCommand = 'executeCommand',
}

interface PermissionMapping {
    permission: AgentPermission;
    configKey: string;
}

const PERMISSION_CONFIG_MAP: PermissionMapping[] = [
    { permission: AgentPermission.ReadEditor, configKey: 'readEditor' },
    { permission: AgentPermission.ReadTerminal, configKey: 'readTerminal' },
    { permission: AgentPermission.ReadFolder, configKey: 'readFolder' },
    { permission: AgentPermission.WriteFile, configKey: 'writeFile' },
    { permission: AgentPermission.DeleteFile, configKey: 'deleteFile' },
    { permission: AgentPermission.InsertCode, configKey: 'insertCode' },
    { permission: AgentPermission.RunCode, configKey: 'runCode' },
    { permission: AgentPermission.TestCode, configKey: 'testCode' },
    { permission: AgentPermission.DebugCode, configKey: 'debugCode' },
    { permission: AgentPermission.BrowseWeb, configKey: 'browseWeb' },
    { permission: AgentPermission.ExecuteCommand, configKey: 'executeCommand' },
];

export function loadPermissions(configPrefix: string): Set<AgentPermission> {
    const config = ConfigService.getInstance();
    const perms = new Set<AgentPermission>();
    for (const mapping of PERMISSION_CONFIG_MAP) {
        if (config.isPermissionEnabled(configPrefix, mapping.configKey)) {
            perms.add(mapping.permission);
        }
    }
    return perms;
}

export function getPermissionNames(permissions: Set<AgentPermission>): string {
    const arr = Array.from(permissions);
    return arr.length > 0 ? arr.join(', ') : 'none';
}

export const ALL_PERMISSIONS: AgentPermission[] = Object.values(AgentPermission);
