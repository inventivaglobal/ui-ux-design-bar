import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
export function Accessible() {
  return <div><IconButton aria-label="Delete item"><DeleteIcon /></IconButton><img src="/example.png" alt="Example preview" /></div>;
}
