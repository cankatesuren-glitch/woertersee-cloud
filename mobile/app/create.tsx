import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MobileNav } from "@/components/mobile-nav";
import { ApiError, generateAiDeck, generateAiDeckFromPdf, importAiDeck, type AiDeckCard, type AiDeckPreview } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const levels = ["A1","A2","B1","B2","C1"];
const counts = [5,10,20];

export default function CreateScreen(){
  const auth=useAuth();
  const[mode,setMode]=useState<"topic"|"pdf">("topic");
  const[topic,setTopic]=useState("");const[level,setLevel]=useState("B1");const[count,setCount]=useState(10);const[category,setCategory]=useState("");
  const[file,setFile]=useState<DocumentPicker.DocumentPickerAsset|null>(null);const[preview,setPreview]=useState<AiDeckPreview|null>(null);
  const[busy,setBusy]=useState(false);const[message,setMessage]=useState("");const[error,setError]=useState("");

  async function token(){const value=await auth.getAccessToken();if(!value)throw new ApiError("Connect your account before creating a deck.");return value}
  async function pickPdf(){const result=await DocumentPicker.getDocumentAsync({type:"application/pdf",copyToCacheDirectory:true,multiple:false});if(!result.canceled)setFile(result.assets[0])}
  async function create(){if(busy||mode==="topic"&&!topic.trim()||mode==="pdf"&&!file)return;setBusy(true);setError("");setMessage("");
    try{const access=await token();const request={level,cardCount:count,category:category.trim()||null};const deck=mode==="topic"?await generateAiDeck(access,{...request,topic:topic.trim()}):await generateAiDeckFromPdf(access,file!,request);setPreview(deck);setCategory(deck.category)}catch(e){setError(textFor(e))}finally{setBusy(false)}}
  async function save(){if(!preview?.cards.length||busy)return;setBusy(true);setError("");try{const result=await importAiDeck(await token(),{...preview,category:category.trim()||preview.category});setPreview(null);setMessage(`${result.added} words saved${result.skipped?` · ${result.skipped} duplicates skipped`:""}. They are ready in My Words and Practice.`)}catch(e){setError(textFor(e))}finally{setBusy(false)}}
  function updateCard(index:number,field:keyof AiDeckCard,value:string){setPreview(current=>current?{...current,cards:current.cards.map((card,i)=>i===index?{...card,[field]:value||null}:card)}:current)}
  function removeCard(index:number){setPreview(current=>current?{...current,cards:current.cards.filter((_,i)=>i!==index)}:current)}

  return <SafeAreaView style={s.safe}><ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
    <Text style={s.eyebrow}>CREATE A DECK</Text><Text style={s.title}>Build from what matters today.</Text><Text style={s.copy}>Start with a situation or choose a PDF. You review every word before it is saved.</Text>
    {!preview&&<View style={s.panel}>
      <View style={s.tabs}><Tab active={mode==="topic"} label="Topic" press={()=>setMode("topic")}/><Tab active={mode==="pdf"} label="PDF" press={()=>setMode("pdf")}/></View>
      {mode==="topic"?<Field label="Topic or situation" value={topic} change={setTopic} multiline placeholder="For example: visiting a doctor with a cold"/>:<View><Text style={s.label}>PDF DOCUMENT</Text><Pressable onPress={pickPdf} style={s.file}><Text style={s.fileTitle}>{file?.name??"Choose a PDF"}</Text><Text style={s.fileCopy}>{file?`${file.size?`${Math.ceil(file.size/1024)} KB · `:""}Tap to replace`:"Up to 10 MB and 100 pages"}</Text></Pressable></View>}
      <Text style={s.label}>LEVEL</Text><View style={s.chips}>{levels.map(value=><Chip key={value} active={level===value} label={value} press={()=>setLevel(value)}/>)}</View>
      <Text style={s.label}>NUMBER OF WORDS</Text><View style={s.chips}>{counts.map(value=><Chip key={value} active={count===value} label={String(value)} press={()=>setCount(value)}/>)}</View>
      <Field label="Category (optional)" value={category} change={setCategory} placeholder="Doctor visit, Work, Kapitel 4…"/>
      <Pressable disabled={busy||(mode==="topic"?!topic.trim():!file)} onPress={create} style={[s.primary,(busy||(mode==="topic"?!topic.trim():!file))&&s.disabled]}>{busy?<ActivityIndicator color="#fffdf8"/>:<Text style={s.primaryText}>Create draft</Text>}</Pressable>
    </View>}
    {preview&&<View style={s.preview}><View style={s.previewHead}><View><Text style={s.eyebrow}>REVIEW</Text><Text style={s.previewTitle}>{preview.cards.length} words</Text></View><Pressable onPress={()=>setPreview(null)}><Text style={s.link}>Start over</Text></Pressable></View>
      <Field label="Save to category" value={category} change={setCategory} placeholder="My new deck"/>
      {preview.cards.map((card,index)=><View key={`${card.german}-${index}`} style={s.card}><View style={s.cardHead}><Text style={s.number}>{String(index+1).padStart(2,"0")}</Text><Pressable onPress={()=>removeCard(index)}><Text style={s.remove}>Remove</Text></Pressable></View><Field label="German" value={card.german} change={value=>updateCard(index,"german",value)} placeholder="German word"/><Field label="English" value={card.english} change={value=>updateCard(index,"english",value)} placeholder="English meaning"/>{card.description&&<Field label="Note" value={card.description} change={value=>updateCard(index,"description",value)} multiline placeholder="Optional note"/>}</View>)}
      <Pressable disabled={busy||!preview.cards.length} onPress={save} style={[s.primary,(busy||!preview.cards.length)&&s.disabled]}>{busy?<ActivityIndicator color="#fffdf8"/>:<Text style={s.primaryText}>Save {preview.cards.length} words</Text>}</Pressable>
    </View>}
    {!!message&&<Text style={s.notice}>{message}</Text>}{!!error&&<Text style={s.error}>{error}</Text>}
  </ScrollView><MobileNav/></SafeAreaView>
}

function Field({label,value,change,placeholder,multiline=false}:{label:string;value:string;change:(value:string)=>void;placeholder:string;multiline?:boolean}){return <View style={s.field}><Text style={s.label}>{label.toUpperCase()}</Text><TextInput multiline={multiline} onChangeText={change} placeholder={placeholder} placeholderTextColor="#8a938f" style={[s.input,multiline&&s.textarea]} value={value}/></View>}
function Tab({active,label,press}:{active:boolean;label:string;press:()=>void}){return <Pressable onPress={press} style={[s.tab,active&&s.tabActive]}><Text style={[s.tabText,active&&s.tabTextActive]}>{label}</Text></Pressable>}
function Chip({active,label,press}:{active:boolean;label:string;press:()=>void}){return <Pressable onPress={press} style={[s.chip,active&&s.chipActive]}><Text style={[s.chipText,active&&s.chipTextActive]}>{label}</Text></Pressable>}
function textFor(error:unknown){return error instanceof ApiError?error.message:"The deck could not be created."}

const s=StyleSheet.create({safe:{flex:1,backgroundColor:"#f6f0e4"},page:{padding:24,paddingTop:42,paddingBottom:120},eyebrow:{color:"#9a431f",fontSize:12,fontWeight:"800",letterSpacing:2},title:{color:"#173b38",fontFamily:"Georgia",fontSize:39,lineHeight:45,marginTop:14},copy:{color:"#63716d",fontSize:16,lineHeight:24,marginTop:12},panel:{backgroundColor:"#fffdf8",borderColor:"#ded5c4",borderRadius:20,borderWidth:1,gap:16,marginTop:24,padding:18},tabs:{backgroundColor:"#eee8dc",borderRadius:12,flexDirection:"row",padding:4},tab:{alignItems:"center",borderRadius:9,flex:1,paddingVertical:10},tabActive:{backgroundColor:"#173b38"},tabText:{color:"#63716d",fontWeight:"700"},tabTextActive:{color:"#fffdf8"},field:{marginTop:2},label:{color:"#52645f",fontSize:11,fontWeight:"800",letterSpacing:.7,marginBottom:7,marginTop:4},input:{backgroundColor:"#f7f3eb",borderColor:"#d8d0c1",borderRadius:12,borderWidth:1,color:"#173b38",fontSize:15,paddingHorizontal:13,paddingVertical:12},textarea:{minHeight:96,textAlignVertical:"top"},chips:{flexDirection:"row",flexWrap:"wrap",gap:8},chip:{borderColor:"#cfc6b7",borderRadius:99,borderWidth:1,minWidth:46,paddingHorizontal:12,paddingVertical:8},chipActive:{backgroundColor:"#173b38",borderColor:"#173b38"},chipText:{color:"#52645f",fontWeight:"700",textAlign:"center"},chipTextActive:{color:"#fffdf8"},file:{borderColor:"#c9bfae",borderRadius:14,borderStyle:"dashed",borderWidth:1.5,padding:20},fileTitle:{color:"#173b38",fontSize:16,fontWeight:"700"},fileCopy:{color:"#7b8883",fontSize:12,marginTop:6},primary:{alignItems:"center",backgroundColor:"#173b38",borderRadius:14,marginTop:4,minHeight:52,justifyContent:"center",paddingVertical:15},primaryText:{color:"#fffdf8",fontSize:15,fontWeight:"800"},disabled:{opacity:.35},preview:{gap:14,marginTop:28},previewHead:{alignItems:"flex-end",flexDirection:"row",justifyContent:"space-between"},previewTitle:{color:"#173b38",fontFamily:"Georgia",fontSize:30,marginTop:7},link:{color:"#9a431f",fontSize:13,fontWeight:"700"},card:{backgroundColor:"#fffdf8",borderColor:"#ded5c4",borderRadius:18,borderWidth:1,gap:10,padding:16},cardHead:{alignItems:"center",flexDirection:"row",justifyContent:"space-between"},number:{color:"#9a431f",fontFamily:"Georgia",fontSize:21},remove:{color:"#9a431f",fontSize:12,fontWeight:"700"},notice:{backgroundColor:"#e5efe7",borderRadius:14,color:"#356047",lineHeight:21,marginTop:20,padding:16},error:{backgroundColor:"#fae8e2",borderRadius:14,color:"#8a3927",lineHeight:21,marginTop:20,padding:16}});
