import React, {useState} from 'react';
import {Container, Stack, Typography, ThemeProvider, CssBaseline} from '@mui/material';
import {BarButton,BarIconButton,BarTextField,BarSelect,BarAlert,BarDialog,BarCard,BarTabs,BarTable} from '../../../packages/components/index.mjs';
import {createBarTheme} from '../../../packages/tokens/mui-theme.mjs';
const theme=createBarTheme();
export default function Gallery(){
 const [open,setOpen]=useState(false),[tab,setTab]=useState(0),[name,setName]=useState(''),[status,setStatus]=useState('draft');
 return <ThemeProvider theme={theme}><CssBaseline/><Container component="main" maxWidth="md" sx={{py:4}}><Stack spacing={3}>
 <Typography component="h1" variant="h4">B.A.R component gallery</Typography>
 <BarAlert message="Local demonstration only. No data leaves this page."/>
 <BarCard title="Curated controls"><Stack spacing={2}>
 <BarTextField label="Record name" value={name} onChange={e=>setName(e.target.value)}/>
 <Stack direction="row" spacing={1} alignItems="center"><BarIconButton label="Clear record name" icon="action.close" onClick={()=>setName('')}/><Typography component="span" variant="body2" aria-hidden="true">Clear record name</Typography></Stack>
 <BarSelect label="Record status" value={status} onChange={e=>setStatus(e.target.value)} options={[{value:'draft',label:'Draft'},{value:'ready',label:'Ready'}]}/>
 <BarButton label="Review record" onClick={()=>setOpen(true)}/>
 </Stack></BarCard>
 <BarTabs label="Record information" value={tab} onChange={(_,v)=>setTab(v)} items={[{label:'Overview',content:'Overview content'},{label:'Details',content:'Details content'}]}/>
 <BarTable caption="Local records" columns={[{key:'name',label:'Name'},{key:'status',label:'Status'}]} rows={[{name:name||'Untitled',status}]}/>
 <BarDialog title="Review record" open={open} onClose={()=>setOpen(false)} actions={<BarButton label="Close review" onClick={()=>setOpen(false)}/>}>This dialog does not submit or save data.</BarDialog>
 </Stack></Container></ThemeProvider>;
}
