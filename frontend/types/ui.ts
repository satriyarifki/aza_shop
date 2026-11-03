export type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
};

export type TableColumn = {
  label: string;
  align?: "left" | "right";
};
