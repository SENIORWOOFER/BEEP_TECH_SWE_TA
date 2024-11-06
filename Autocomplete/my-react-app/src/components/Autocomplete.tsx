import { useState, useEffect, useRef, forwardRef } from "react";
import {
  autoUpdate,
  size,
  flip,
  useId,
  useDismiss,
  useFloating,
  useInteractions,
  useListNavigation,
  useRole,
  FloatingFocusManager,
  FloatingPortal
} from "@floating-ui/react";

// Define a type for options with label and description
interface OptionType {
  label: string;
  description: string;
}

interface ItemProps {
  children: React.ReactNode;
  active: boolean;
  selected: boolean;
}

interface AutoCompleteProps<T> {
  searchType: "sync" | "async";
  options: T[];
  description?: string;
  disabled?: boolean;
  filterOptions?: (options: T[], inputValue: string) => T[];
  label?: string;
  loading?: boolean;
  multiple?: boolean;
  onChange?: (value: T | T[]) => void;
  onInputChange?: (inputValue: string) => void;
  placeholder?: string;
  renderOption?: (option: T) => React.ReactNode;
  value?: T | T[];
}

// Item component for displaying each option
const Item = forwardRef<HTMLDivElement, ItemProps & React.HTMLProps<HTMLDivElement>>(
  ({ children, active, selected, ...rest }, ref) => {
    const id = useId();
    return (
      <div
        ref={ref}
        role="option"
        id={id}
        aria-selected={active}
        {...rest}
        style={{
          display: "flex",
          alignItems: "center",
          background: active ? "lightgreen" : "none",
          padding: 4,
          cursor: "pointer",
          ...rest.style
        }}
      >
        <input type="checkbox" checked={selected} readOnly style={{ marginRight: 8 }} />
        {children}
      </div>
    );
  }
);

function AutoComplete<T extends OptionType>({
  searchType,
  options,
  description,
  disabled = false,
  filterOptions,
  label,
  loading: externalLoading = false,
  multiple = false,
  onChange,
  onInputChange,
  placeholder = "Search...",
  renderOption,
  value = multiple ? [] : undefined
}: AutoCompleteProps<T>) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [filteredItems, setFilteredItems] = useState(options);
  const [selectedItems, setSelectedItems] = useState<T[]>(Array.isArray(value) ? value : value ? [value] : []);
  const [loading, setLoading] = useState(false);
  const listRef = useRef<Array<HTMLElement | null>>([]);
  const debounceTimeout = useRef<number | null>(null);

  const { refs, floatingStyles, context } = useFloating<HTMLInputElement>({
    whileElementsMounted: autoUpdate,
    open,
    onOpenChange: setOpen,
    middleware: [
      flip({ padding: 10 }),
      size({
        apply({ rects, availableHeight, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
            maxHeight: `${availableHeight}px`
          });
        },
        padding: 10
      })
    ]
  });

  const role = useRole(context, { role: "listbox" });
  const dismiss = useDismiss(context);
  const listNav = useListNavigation(context, {
    listRef,
    activeIndex,
    onNavigate: setActiveIndex,
    virtual: true,
    loop: true
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([role, dismiss, listNav]);

  const handleSearch = (value: string) => {
    if (searchType === "sync") {
      const results = filterOptions ? filterOptions(options, value) : options.filter((item) =>
        item.label.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredItems(results);
    } else {
      setLoading(true);
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      debounceTimeout.current = window.setTimeout(() => {
        const results = filterOptions ? filterOptions(options, value) : options.filter((item) =>
          item.label.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(results);
        setLoading(false);
      }, 500);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    onInputChange?.(value);

    if (value) {
      setOpen(true);
      setActiveIndex(0);
      handleSearch(value);
    } else {
      setOpen(false);
      setFilteredItems(options);
    }
  };

  // Show full list on focus for sync search
  const handleFocus = () => {
    if (searchType === "sync") {
      setFilteredItems(options); // Show all options when focused
      setOpen(true);
    }
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, []);

  const toggleSelectItem = (item: T) => {
    setSelectedItems((prevSelected) => {
      let updatedItems;
      if (prevSelected.includes(item)) {
        updatedItems = prevSelected.filter((selected) => selected !== item);
      } else {
        updatedItems = multiple ? [...prevSelected, item] : [item];
      }
      onChange?.(multiple ? updatedItems : updatedItems[0]);
      return updatedItems;
    });
  };

  return (
    <div style={{ width: "300px", textAlign: "left", marginBottom: '10px' }}>
      {label && <label style={{ fontWeight: "bold" }}>{label}</label>}
      <input
        {...getReferenceProps({
          ref: refs.setReference,
          onChange: handleChange,
          value: inputValue,
          placeholder,
          disabled,
          onClick: handleFocus, // Show full list on click for sync search
          "aria-autocomplete": "list",
          onKeyDown(event) {
            if (event.key === "Enter" && activeIndex != null && filteredItems[activeIndex]) {
              event.preventDefault();
              toggleSelectItem(filteredItems[activeIndex]);
            }
          }
        })}
        style={{ width: "100%", height: "40px", fontSize: 16, marginBottom: "8px" }}
      />
      {description && <small>{description}</small>}
      <FloatingPortal>
        {open && (
          <FloatingFocusManager context={context} initialFocus={-1} visuallyHiddenDismiss>
            <div
              {...getFloatingProps({
                ref: refs.setFloating,
                style: {
                  ...floatingStyles,
                  background: "#eee",
                  color: "black",
                  overflowY: "auto"
                }
              })}
            >
              {(loading || externalLoading) ? (
                <div style={{ padding: 8 }}>Loading...</div>
              ) : filteredItems.length === 0 ? (
                <div style={{ padding: 8 }}>No results found</div>
              ) : (
                filteredItems.map((item, index) => (
                  <Item
                    {...getItemProps({
                      key: item.label,
                      ref(node) {
                        listRef.current[index] = node;
                      },
                      onClick() {
                        toggleSelectItem(item);
                        refs.domReference.current?.focus();
                      }
                    })}
                    active={activeIndex === index}
                    selected={selectedItems.includes(item)}
                  >
                    {renderOption ? renderOption(item) : (
                      <div>
                        <strong>{item.label}</strong>
                        <p style={{ margin: 0, fontSize: "small", color: "gray" }}>{item.description}</p>
                      </div>
                    )}
                  </Item>
                ))
              )}
            </div>
          </FloatingFocusManager>
        )}
      </FloatingPortal>
    </div>
  );
}

export default AutoComplete;
