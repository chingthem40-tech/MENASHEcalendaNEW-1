/**
 * FilterChip
 * MMDL input — selectable filter chip (alias of MenasheChip with filter variant).
 * Accepts an array of options for rendering a chip group.
 */

import React, { memo } from "react";
import { View, ScrollView, type StyleProp, type ViewStyle } from "react-native";
import { MenasheChip } from "../foundation/MenasheChip";
import { useThemeTokens } from "@/src/mobile/design-system";

interface FilterOption {
  label:  string;
  value:  string;
}

interface FilterChipGroupProps {
  options:         FilterOption[];
  selected:        string[];
  onToggle:        (value: string) => void;
  multiSelect?:    boolean;
  scrollable?:     boolean;
  disabled?:       boolean;
  style?:          StyleProp<ViewStyle>;
  testID?:         string;
}

export const FilterChipGroup = memo<FilterChipGroupProps>(function FilterChipGroup({
  options,
  selected,
  onToggle,
  multiSelect  = true,
  scrollable   = true,
  disabled     = false,
  style,
  testID,
}) {
  const { sp } = useThemeTokens();

  const chips = options.map((opt) => (
    <MenasheChip
      key={opt.value}
      label={opt.label}
      variant="filter"
      selected={selected.includes(opt.value)}
      disabled={disabled}
      onPress={() => onToggle(opt.value)}
      accessibilityLabel={`Filter: ${opt.label}`}
    />
  ));

  if (scrollable) {
    return (
      <ScrollView
        testID={testID}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: sp[2], paddingHorizontal: sp[4] }}
        style={style}
      >
        {chips}
      </ScrollView>
    );
  }

  return (
    <View
      testID={testID}
      style={[{ flexDirection: "row", flexWrap: "wrap", gap: sp[2] }, style]}
    >
      {chips}
    </View>
  );
});
