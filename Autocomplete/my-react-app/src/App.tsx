import AutoComplete from './components/Autocomplete.tsx';
import {data} from './components/data.ts';

type OptionType = { label: string; description: string };

function App() {

    // Custom filter function for the `filterOptions` prop
    const customFilterOptions = (options: OptionType[], inputValue: string): OptionType[] => {
      return options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      );
    };
  
    // Custom render function for `renderOption`
    const customRenderOption = (option: OptionType) => (
      <div>
        <strong>{option.label}</strong> <br />
        <span style={{ fontSize: "small", color: "gray" }}>{option.description}</span>
      </div>
    );

  return (
    <div style={styles.container}>
      <div style={styles.autocompleteBox}>
        <AutoComplete 
            searchType="sync" 
            options={data} 
            placeholder="Search for fruits and vegetables..." 
            label="Sync Search"
            description="This search bar uses sync search."
            disabled={false}
            filterOptions={customFilterOptions} // Custom filtering function
            multiple={true} // Allows multiple selections
            onChange={(selectedItems) => console.log("Sync selected items:", selectedItems)}
            onInputChange={(inputValue) => console.log("Sync input changed:", inputValue)}
            renderOption={customRenderOption} // Custom render function for each option
            value={[]} // Pass initial selected value(s) if needed
          />

        <AutoComplete 
          searchType="async" 
          options={data} 
          placeholder="Search for fruits and vegetables..." 
          label="Async Search"
          description="This search bar uses async search."
          disabled={false} 
          loading={false}
          multiple={true} // Single selection for async search
          onChange={(selectedItem) => console.log("Async selected item:", selectedItem)}
          onInputChange={(inputValue) => console.log("Async input changed:", inputValue)}
          filterOptions={customFilterOptions}
          renderOption={customRenderOption}
          value={undefined} // Pass initial selected value if needed for single selection
        />
      </div>
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh', // Full viewport height
    backgroundColor: '#f4f4f9' // Light background color
  },
  autocompleteBox: {
    width: '300px', // Adjust width as needed
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Subtle shadow
    textAlign: 'center' // Center-align text within the box
  },
};

export default App
