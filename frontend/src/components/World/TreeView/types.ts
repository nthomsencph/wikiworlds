export interface TreeNode {
  id: string
  name: string
  icon?: string | null
  entryTypeName?: string | null
  children?: TreeNode[]
  childrenCount?: number
  isEntryTypeFolder?: boolean
}
