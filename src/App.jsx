import React, { useMemo, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check, ChevronDown,
  CircleHelp, Clipboard, CloudUpload, Download, ExternalLink, FileCheck2,
  FileText, Github, GraduationCap, Link2, LoaderCircle, LockKeyhole, Menu,
  RefreshCw, ScanSearch, ShieldCheck, Sparkles, Target, Upload, WandSparkles,
  X, Zap
} from 'lucide-react';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

const SKILL_GROUPS = {
  'Programming languages': ['javascript','typescript','python','java','c++','c#','php','ruby','go','golang','rust','kotlin','swift','sql','html','css'],
  'Frontend': ['react','next.js','nextjs','angular','vue','vite','tailwind','bootstrap','redux','responsive design','webpack'],
  'Backend': ['node.js','nodejs','express','fastapi','django','flask','spring boot','rest api','graphql','microservices'],
  'Databases': ['mongodb','mysql','postgresql','postgres','sqlite','redis','firebase','supabase','oracle'],
  'Cloud & DevOps': ['aws','azure','gcp','google cloud','docker','kubernetes','ci/cd','jenkins','github actions','linux','vercel','render'],
  'Data & AI': ['machine learning','deep learning','pandas','numpy','tensorflow','pytorch','scikit-learn','data analysis','power bi','tableau','nlp','llm','generative ai'],
  'Tools': ['git','github','jira','figma','postman','vscode','excel','agile','scrum']
};
const ALL_SKILLS = Object.values(SKILL_GROUPS).flat();
const SECTION_PATTERNS = {
  summary: /\b(summary|profile|objective|about me|professional summary)\b/i,
  experience: /\b(experience|employment|work history|internship)\b/i,
  education: /\b(education|academic|qualification|coursework)\b/i,
  projects: /\b(projects|personal projects|academic projects)\b/i,
  skills: /\b(skills|technical skills|technologies|core competencies)\b/i,
  certifications: /\b(certifications|certificates|licenses)\b/i
};
const STOP = new Set(('a an and are as at be by for from has have in into is it its of on or our that the their this to with will you your we they role work job candidate team skills experience knowledge ability strong excellent preferred required responsibilities requirements including using use plus years').split(' '));

function normalize(s='') { return s.toLowerCase().replace(/[^a-z0-9+#.\s-]/g,' ').replace(/\s+/g,' ').trim(); }
function titleCase(s='') { return s.replace(/\b\w/g, x => x.toUpperCase()); }
function extractSkills(text) {
  const n = ` ${normalize(text)} `;
  return [...new Set(ALL_SKILLS.filter(skill => n.includes(` ${normalize(skill)} `) || n.includes(` ${normalize(skill)}\n`)))];
}
function keywordTerms(text) {
  const words = normalize(text).split(' ').filter(w => w.length > 3 && !STOP.has(w) && !/^\d+$/.test(w));
  const freq = new Map(); words.forEach(w => freq.set(w,(freq.get(w)||0)+1));
  return [...freq.entries()].sort((a,b)=>b[1]-a[1]).slice(0,30).map(([w])=>w);
}
function analyzeResume(text) {
  const skills = extractSkills(text);
  const lines = text.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  const sections = Object.entries(SECTION_PATTERNS).filter(([,re])=>re.test(text)).map(([k])=>k);
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || '';
  const phone = text.match(/(?:\+?\d[\d\s().-]{7,}\d)/)?.[0] || '';
  const metrics = (text.match(/\b\d+(?:\.\d+)?\s?(?:%|percent|users|customers|projects|hours|days|weeks|months|years|x)\b/gi)||[]).length;
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const checks = [
    ['Contact details', Boolean(email || phone), 'Add a professional email address and phone number.'],
    ['Professional summary', sections.includes('summary'), 'Add a short 2–4 line summary tailored to your target role.'],
    ['Work experience', sections.includes('experience'), 'Include internships, employment or relevant practical experience.'],
    ['Education', sections.includes('education'), 'List your degree, institution and graduation year.'],
    ['Projects', sections.includes('projects'), 'Add 2–3 relevant projects with your contribution and technologies.'],
    ['Skills', sections.includes('skills') || skills.length >= 4, 'Add a focused technical skills section.'],
    ['Measurable impact', metrics > 0, 'Quantify outcomes with numbers, percentages, users or time saved.'],
    ['Certifications', sections.includes('certifications'), 'Include relevant certifications if you have them.']
  ];
  const completeness = Math.round(checks.filter(x=>x[1]).length / checks.length * 100);
  const strengths = [];
  if (skills.length >= 6) strengths.push(`Shows a broad technical skill set (${skills.length} skills detected).`);
  if (sections.includes('projects')) strengths.push('Includes a projects section that can demonstrate practical ability.');
  if (sections.includes('experience')) strengths.push('Includes an experience or internship section.');
  if (metrics) strengths.push('Contains measurable results or quantified details.');
  if (email) strengths.push('Includes a detectable email address.');
  const suggestions = checks.filter(x=>!x[1]).map(x=>x[2]);
  if (wordCount < 120) suggestions.unshift('The extracted resume is very short. Check that the complete resume was uploaded.');
  if (wordCount > 900) suggestions.push('Tighten the resume: remove repeated responsibilities and keep the most relevant achievements.');
  if (skills.length > 22) suggestions.push('Prioritize the skills most relevant to your target role instead of presenting a long undifferentiated list.');
  const qualityPlan = [];
  if (!sections.includes('summary')) qualityPlan.push({priority:'High', title:'Add a targeted professional summary', detail:'Write 2–3 lines naming your target role, strongest relevant skills and the value you can bring.'});
  if (!sections.includes('projects')) qualityPlan.push({priority:'High', title:'Show proof through projects', detail:'Add 2–3 relevant projects. For each, explain the problem, your contribution, tools used and outcome.'});
  if (!sections.includes('experience')) qualityPlan.push({priority:'Medium', title:'Add practical experience', detail:'Include internships, freelance work, volunteering, open-source contributions or substantial academic work where relevant.'});
  if (!metrics) qualityPlan.push({priority:'High', title:'Make achievements measurable', detail:'Where truthful, add scale or outcomes: users supported, load time reduced, tasks automated, project duration or team size. Never invent numbers.'});
  if (skills.length < 6) qualityPlan.push({priority:'Medium', title:'Make technical skills easier to scan', detail:'List specific tools and technologies you can confidently discuss, grouped by category.'});
  if (!sections.includes('certifications')) qualityPlan.push({priority:'Low', title:'Add relevant certifications', detail:'Include only completed, verifiable certifications that support your target role.'});
  qualityPlan.push({priority:'Medium', title:'Tailor the resume to each vacancy', detail:'Reuse the employer’s relevant terminology only when it accurately describes your experience. Put the strongest matching evidence near the top.'});
  if (wordCount > 900) qualityPlan.push({priority:'Medium', title:'Improve focus and readability', detail:'Remove repetition and keep bullets concise. Prioritize recent and role-relevant information.'});
  return {skills, sections, checks, completeness, strengths, suggestions, qualityPlan, email, phone, wordCount, metrics, lines};
}
function compareJob(resumeText, jobText) {
  const resumeSkills = extractSkills(resumeText), jobSkills = extractSkills(jobText);
  const matched = jobSkills.filter(s=>resumeSkills.includes(s));
  const missing = jobSkills.filter(s=>!resumeSkills.includes(s));
  const jobTerms = keywordTerms(jobText);
  const resumeNorm = normalize(resumeText);
  const matchedTerms = jobTerms.filter(w=>resumeNorm.includes(w));
  const skillScore = jobSkills.length ? matched.length / jobSkills.length : 0;
  const keywordScore = jobTerms.length ? matchedTerms.length / jobTerms.length : 0;
  const score = Math.round((jobSkills.length ? skillScore * 0.78 + keywordScore * 0.22 : keywordScore) * 100);
  const recommendations = [];
  if (missing.length) recommendations.push(`Build evidence for these role skills where relevant: ${missing.slice(0,8).join(', ')}.`);
  if (!/\b(achieved|improved|reduced|increased|built|developed|created|delivered|implemented|automated)\b/i.test(resumeText)) recommendations.push('Rewrite experience and project bullets to start with clear action verbs and explain the outcome.');
  if (!/\b(intern|internship|experience|employment)\b/i.test(resumeText)) recommendations.push('If applicable, add internships, freelance work, volunteering or practical experience.');
  if (score < 50) recommendations.push('Tailor your summary and project descriptions to the responsibilities you genuinely match.');
  if (!recommendations.length) recommendations.push('Prioritize the strongest matching projects and add concrete evidence for each key requirement.');
  return {score, matched, missing, matchedTerms, jobSkills, jobTerms, recommendations};
}
async function readResume(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'pdf') {
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({data}).promise;
    let text = '';
    for (let p=1;p<=pdf.numPages;p++) {
      const page = await pdf.getPage(p); const content = await page.getTextContent();
      text += content.items.map(i=>i.str).join(' ') + '\n';
    }
    if (!text.trim()) throw new Error('No selectable text was found. This PDF may be scanned; please use a text-based PDF or DOCX.');
    return text;
  }
  if (ext === 'docx') {
    const result = await mammoth.extractRawText({arrayBuffer: await file.arrayBuffer()});
    if (!result.value.trim()) throw new Error('No readable text was found in this DOCX file.');
    return result.value;
  }
  throw new Error('Please upload a PDF or DOCX file.');
}
function App() {
  const [file,setFile] = useState(null), [resumeText,setResumeText] = useState(''), [resume,setResume] = useState(null);
  const [jobUrl,setJobUrl] = useState(''), [jobText,setJobText] = useState(''), [jobTitle,setJobTitle] = useState(''), [jobCompany,setJobCompany] = useState('');
  const [urlBusy,setUrlBusy] = useState(false), [busy,setBusy] = useState(false), [step,setStep] = useState('');
  const [error,setError] = useState(''), [notice,setNotice] = useState(''), [tab,setTab] = useState('overview');
  const [comparison,setComparison] = useState(null), [drag,setDrag] = useState(false);
  const inputRef = useRef(null);

  const canAnalyze = Boolean(resumeText.trim());
  const jobReady = Boolean(jobText.trim());
  const scoreLabel = comparison?.score >= 75 ? 'Strong alignment' : comparison?.score >= 50 ? 'Partial alignment' : 'Needs tailoring';

  async function onFile(selected) {
    if (!selected) return;
    setError(''); setNotice(''); setBusy(true); setStep('Reading your resume locally…');
    try {
      const text = await readResume(selected);
      setFile(selected); setResumeText(text); setResume(analyzeResume(text)); setComparison(null);
      setNotice('Resume read successfully. Your file was processed in this browser.'); setTab('overview');
    } catch(e) { setError(e.message || 'Could not read this file.'); }
    finally { setBusy(false); setStep(''); }
  }

  async function importJobUrl() {
    if (!jobUrl.trim()) return setError('Enter a job posting URL first.');
    let url;
    try { url = new URL(jobUrl.trim()); if (!['http:','https:'].includes(url.protocol)) throw new Error(); }
    catch { return setError('Enter a valid http or https job URL.'); }
    setUrlBusy(true); setError(''); setNotice('');
    try {
      // Public-page reader is an optional third-party service. It cannot bypass sign-in or platform restrictions.
      const readerUrl = `https://r.jina.ai/${url.href}`;
      const response = await fetch(readerUrl, {headers:{'Accept':'text/plain'}});
      if (!response.ok) throw new Error(`The public page reader returned ${response.status}.`);
      const text = await response.text();
      const cleaned = text.replace(/^Title:.*\n/m,'').replace(/^URL Source:.*\n/m,'').trim();
      if (cleaned.length < 180) throw new Error('The page did not provide enough public job text. It may require sign-in or block automated access.');
      setJobText(cleaned); setJobTitle('Imported job posting'); setNotice('Public job page imported. Please review the extracted text before comparing.');
    } catch(e) {
      setNotice('Could not read this job URL automatically. This is common for LinkedIn and pages that require sign-in. Paste the job description below instead.');
    } finally { setUrlBusy(false); }
  }

  async function runComparison() {
    if (!resumeText.trim()) return setError('Upload your resume first.');
    if (!jobText.trim()) return setError('Paste a job description or import a publicly accessible job URL.');
    setBusy(true); setError(''); setNotice(''); setTab('comparison');
    const stages = ['Comparing technical skills…','Matching job keywords…','Checking evidence in your resume…','Preparing your match report…'];
    for (const s of stages) { setStep(s); await new Promise(r=>setTimeout(r,420)); }
    const result = compareJob(resumeText,jobText);
    setComparison(result); setBusy(false); setStep(''); setNotice('Comparison complete using browser-based rules and keyword matching.');
  }

  function downloadReport() {
    if (!resume || !comparison) return;
    const report = [
      'RESUME & JOB MATCH REPORT', '=========================',
      `Resume: ${file?.name || 'Uploaded resume'}`, `Job: ${jobTitle || 'Job posting'}`, `Company: ${jobCompany || 'Not specified'}`,
      `Match score: ${comparison.score}% (${scoreLabel})`, '',
      'MATCHED SKILLS', ...comparison.matched.map(x=>`- ${titleCase(x)}`), '',
      'SKILLS TO DEVELOP / EVIDENCE', ...comparison.missing.map(x=>`- ${titleCase(x)}`), '',
      'SUGGESTIONS', ...comparison.recommendations.map(x=>`- ${x}`), '',
      'RESUME PROFILE', `Completeness checks: ${resume.completeness}%`, `Detected skills: ${resume.skills.map(titleCase).join(', ')}`,
      '', 'Note: This is a heuristic keyword-based comparison, not an AI assessment or a prediction of hiring outcomes.'
    ].join('\n');
    const blob = new Blob([report],{type:'text/plain;charset=utf-8'}); const link=document.createElement('a'); link.href=URL.createObjectURL(blob); link.download='resume-job-match-report.txt'; link.click(); URL.revokeObjectURL(link.href);
  }

  const groupedSkills = useMemo(()=>Object.entries(SKILL_GROUPS).map(([name,skills])=>({name,items:skills.filter(s=>resume?.skills.includes(s))})).filter(g=>g.items.length),[resume]);

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Sparkles size={19}/></span><span>Resume<span className="brand-accent">Lens</span></span></a><nav><a href="#analyze">Analyzer</a><a href="#how">How it works</a><a href="#privacy">Privacy</a></nav><div className="top-actions"><span className="local-pill"><span/> Browser-only</span><a className="github-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16}/> <span>Built for your career</span></a></div></header>
    <main id="top">
      <section className="hero"><div className="hero-copy"><div className="eyebrow"><Zap size={14}/> PRIVATE BY DESIGN · NO ACCOUNT REQUIRED</div><h1>Make your resume<br/><span>match the opportunity.</span></h1><p>Understand what your resume communicates, compare it with a job description, and find the gaps worth fixing — all in your browser.</p><div className="hero-points"><span><ShieldCheck size={16}/> Resume stays on your device</span><span><Zap size={16}/> No backend or database</span></div><a href="#analyze" className="btn-primary hero-cta">Analyze my resume <ArrowRight size={17}/></a></div><div className="hero-visual"><div className="orbit orbit-one"/><div className="orbit orbit-two"/><div className="hero-doc"><div className="doc-head"><span/><span/><span/></div><div className="doc-content"><div className="doc-avatar"/><div className="doc-line long"/><div className="doc-line medium"/><div className="doc-rule"/><div className="doc-section-label">EXPERIENCE</div><div className="doc-line long"/><div className="doc-line medium"/><div className="doc-line short"/><div className="doc-section-label">SKILLS</div><div className="doc-tags"><i/><i/><i/><i/><i/></div></div></div><div className="floating-score"><span className="score-icon"><Target size={17}/></span><div><small>JOB MATCH</small><b>78%</b></div><span className="score-trend">+12%</span></div><div className="floating-spark"><Sparkles size={20}/></div></div></section>

      <section id="analyze" className="workspace"><div className="section-heading"><div><div className="eyebrow">YOUR CAREER WORKSPACE</div><h2>Resume analysis & job match</h2><p>Upload once, then compare against the roles you want.</p></div><div className="step-indicator"><span className={file?'done':'active'}>01 <small>Resume</small></span><i/><span className={jobReady?'done':'active'}>02 <small>Job details</small></span><i/><span className={comparison?'done':'active'}>03 <small>Results</small></span></div></div>
        {(error||notice)&&<div className={error?'alert error':'alert success'}>{error?<X size={16}/>:<Check size={16}/>}<span>{error||notice}</span><button onClick={()=>{setError('');setNotice('')}}><X size={15}/></button></div>}
        <div className="input-grid">
          <section className="work-card resume-card"><div className="card-top"><div className="card-icon purple"><FileText size={19}/></div><div><h3>1. Upload your resume</h3><p>PDF or DOCX · processed locally</p></div><span className="required-tag">Required</span></div>
            <div className={`dropzone ${drag?'dragging':''} ${file?'has-file':''}`} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);onFile(e.dataTransfer.files?.[0])}} onClick={()=>inputRef.current?.click()} role="button" tabIndex="0" onKeyDown={e=>e.key==='Enter'&&inputRef.current?.click()}>
              <input ref={inputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={e=>onFile(e.target.files?.[0])}/>
              <div className="upload-icon">{busy&&!resume?<LoaderCircle className="spin" size={25}/>:file?<FileCheck2 size={25}/>:<CloudUpload size={27}/>}</div>
              {file?<><b>{file.name}</b><span>{(file.size/1024).toFixed(0)} KB · Ready to analyze</span><button className="change-file" type="button" onClick={e=>{e.stopPropagation();inputRef.current?.click()}}>Change file</button></>:<><b>Drop your resume here</b><span>or click to browse files</span><em>Maximum recommended size: 10 MB</em></>}
            </div>
            {resume&&<div className="file-summary"><div><BadgeCheck size={16}/><b>Resume parsed</b></div><span>{resume.wordCount.toLocaleString()} words · {resume.skills.length} skills detected</span><button onClick={()=>{setFile(null);setResume(null);setResumeText('');setComparison(null)}} aria-label="Remove resume"><X size={15}/></button></div>}
          </section>
          <section className="work-card job-card-input"><div className="card-top"><div className="card-icon blue"><BriefcaseBusiness size={19}/></div><div><h3>2. Add job requirements</h3><p>Import a public link or paste the description</p></div><span className="required-tag">Required</span></div>
            <label className="field-label">Job posting URL <span>OPTIONAL IMPORT</span></label><div className="url-row"><div className="url-input"><Link2 size={17}/><input value={jobUrl} onChange={e=>setJobUrl(e.target.value)} placeholder="https://www.linkedin.com/jobs/view/..." onKeyDown={e=>e.key==='Enter'&&importJobUrl()}/></div><button className="btn-secondary" disabled={urlBusy||!jobUrl.trim()} onClick={importJobUrl}>{urlBusy?<LoaderCircle className="spin" size={16}/>:<ExternalLink size={15}/>} Import</button></div><div className="url-note"><CircleHelp size={13}/> Public links only. Sign-in protected pages may not import.</div>
            <div className="field-row"><label><span>Job title</span><input value={jobTitle} onChange={e=>setJobTitle(e.target.value)} placeholder="e.g. Frontend Developer"/></label><label><span>Company</span><input value={jobCompany} onChange={e=>setJobCompany(e.target.value)} placeholder="Company name"/></label></div>
            <label className="field-label description-label">Job description / requirements <span>{jobText.length.toLocaleString()} CHARACTERS</span></label><textarea className="job-textarea" value={jobText} onChange={e=>setJobText(e.target.value)} placeholder="Paste the job description here — responsibilities, required skills, qualifications and experience…"/>
            <div className="textarea-foot"><span>Include the requirements section for a more useful comparison.</span><button onClick={()=>{setJobText('');setJobTitle('');setJobCompany('');setComparison(null)}}>Clear</button></div>
          </section>
        </div>
        <div className="analyze-bar"><div className="privacy-note"><LockKeyhole size={16}/><span><b>Your resume stays private.</b> Files are read in this browser and aren't uploaded to a server.</span></div><button className="btn-primary analyze-btn" disabled={!canAnalyze||!jobReady||busy} onClick={runComparison}>{busy?<><LoaderCircle className="spin" size={17}/> Analyzing…</>:<><WandSparkles size={17}/> Compare resume & job <ArrowRight size={16}/></>}</button></div>
        {busy&&<div className="scan-progress"><div className="scan-orb"><ScanSearch size={20}/></div><div><b>Reviewing your match</b><p>{step}</p></div><div className="scan-bars"><i/><i/><i/></div></div>}
      </section>

      {resume&&<section className="results-section"><div className="results-title"><div><div className="eyebrow">YOUR RESUME PROFILE</div><h2>Resume health check</h2><p>A structured review based on the text found in your document.</p></div><span className="result-tag"><Check size={14}/> Parsed locally</span></div><div className="health-grid"><div className="health-score"><div className="ring" style={{'--score':`${resume.completeness}%`}}><div><b>{resume.completeness}%</b><small>COMPLETENESS</small></div></div><div><h3>Resume structure</h3><p>{resume.completeness>=75?'Most core sections were detected. Review the details below.': 'Some common resume sections were not detected. Check the suggestions below.'}</p></div></div><div className="health-details"><div className="mini-stat"><b>{resume.skills.length}</b><span>Skills detected</span></div><div className="mini-stat"><b>{resume.wordCount}</b><span>Words extracted</span></div><div className="mini-stat"><b>{resume.metrics}</b><span>Quantified details</span></div><div className="mini-stat"><b>{resume.sections.length}</b><span>Sections detected</span></div></div></div><VisualInsights resume={resume} comparison={comparison}/>
        <div className="result-tabs"><button className={tab==='overview'?'selected':''} onClick={()=>setTab('overview')}>Overview</button><button className={tab==='skills'?'selected':''} onClick={()=>setTab('skills')}>Detected skills</button><button className={tab==='comparison'?'selected':''} onClick={()=>setTab('comparison')}>Job comparison {comparison&&<span>{comparison.score}%</span>}</button></div>
        {tab==='overview'&&<div className="result-panels"><div className="result-panel"><h3><BadgeCheck size={17}/> What your resume shows</h3>{resume.strengths.length?resume.strengths.map((x,i)=><div className="insight positive" key={i}><Check size={15}/>{x}</div>):<p className="muted">No strong signals were detected yet. Check that your file contains selectable text.</p>}<h3 className="subheading"><Target size={17}/> Suggested improvements</h3>{resume.suggestions.slice(0,6).map((x,i)=><div className="insight suggestion" key={i}><ArrowUpRight size={15}/>{x}</div>)}<h3 className="subheading"><Sparkles size={17}/> Resume quality improvement plan</h3><div className="quality-plan">{resume.qualityPlan.slice(0,7).map((item,i)=><article className="quality-item" key={i}><span className={`priority priority-${item.priority.toLowerCase()}`}>{item.priority}</span><div><b>{item.title}</b><p>{item.detail}</p></div></article>)}</div></div><div className="result-panel"><h3><Clipboard size={17}/> Section checklist</h3>{resume.checks.map(([name,ok,hint])=><div className="check-row" key={name}><span className={ok?'check-dot yes':'check-dot no'}>{ok?<Check size={12}/>:<X size={12}/>}</span><div><b>{name}</b>{!ok&&<small>{hint}</small>}</div><span className={ok?'status-found':'status-missing'}>{ok?'Found':'Review'}</span></div>)}</div></div>}
        {tab==='skills'&&<div className="result-panel skills-panel"><div className="skills-heading"><h3>Technical skills detected</h3><span>{resume.skills.length} identified</span></div>{groupedSkills.length?groupedSkills.map(group=><div className="skill-group" key={group.name}><b>{group.name}</b><div className="skill-chips">{group.items.map(s=><span key={s}>{titleCase(s)}</span>)}</div></div>):<p className="muted">No known skills were detected. Add a clear skills section using standard technology names.</p>}<p className="disclaimer">Skill detection uses a built-in vocabulary. It may miss synonyms, uncommon tools or skills expressed indirectly.</p></div>}
        {tab==='comparison'&&<div className="comparison-placeholder">{comparison?<Comparison result={comparison} title={jobTitle} company={jobCompany} onDownload={downloadReport}/>:<><div className="placeholder-icon"><BriefcaseBusiness size={23}/></div><h3>Ready when you are</h3><p>Upload your resume and add a job description, then select “Compare resume & job”.</p></>}</div>}
      </section>}

      <section id="how" className="how-section"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>How ResumeLens works</h2><div className="how-grid"><div><span>01</span><FileText size={21}/><h3>Read locally</h3><p>PDF and DOCX text is extracted in your browser. Your resume isn't sent to a backend.</p></div><div><span>02</span><ScanSearch size={21}/><h3>Check structure</h3><p>Rules identify common resume sections, skills, contact details and measurable outcomes.</p></div><div><span>03</span><Target size={21}/><h3>Compare the role</h3><p>Detected skills and job keywords are matched to highlight alignment and possible gaps.</p></div></div></section>
      <section id="privacy" className="privacy-section"><div className="privacy-icon"><ShieldCheck size={22}/></div><div><h3>Privacy-first processing</h3><p>Resume parsing and comparison run in your browser. No login, backend, database or resume upload endpoint is used. If you choose URL import, the job URL is sent to the third-party Jina Reader service to retrieve publicly accessible page text. Do not use URL import for confidential links.</p></div></section>
      <footer className="footer"><a className="brand" href="#top"><span className="brand-mark"><Sparkles size={16}/></span>Resume<span className="brand-accent">Lens</span></a><span>Browser-based resume analysis · No account · No database</span><span>Match scores are heuristic signals, not hiring probabilities.</span></footer>
    </main>
  </div>;
}

function VisualInsights({resume, comparison}) {
  const groups = Object.entries(SKILL_GROUPS).map(([name, skills]) => ({name, count:skills.filter(s=>resume.skills.includes(s)).length})).filter(x=>x.count>0).sort((a,b)=>b.count-a.count);
  const max = Math.max(1,...groups.map(x=>x.count));
  const found = resume.checks.filter(x=>x[1]).length;
  const reviewed = resume.checks.length-found;
  return <section className="visual-insights">
    <div className="visual-heading"><div><span className="eyebrow">AT A GLANCE</span><h3>Resume insights dashboard</h3><p>Visual breakdown of detected content, not a hiring prediction.</p></div><span className="visual-chip">Local analysis</span></div>
    <div className="visual-grid">
      <article className="visual-card section-chart"><h4>Resume section coverage</h4><div className="coverage-layout"><div className="coverage-donut" style={{'--found':`${found/resume.checks.length*100}%`}}><div><b>{found}/{resume.checks.length}</b><small>FOUND</small></div></div><div className="coverage-legend"><span><i className="legend-found"/> Detected <b>{found}</b></span><span><i className="legend-review"/> To review <b>{reviewed}</b></span></div></div></article>
      <article className="visual-card skill-chart"><h4>Skills by category</h4>{groups.length?groups.slice(0,5).map(g=><div className="bar-row" key={g.name}><span>{g.name}</span><div className="bar-track"><i style={{width:`${g.count/max*100}%`}}/></div><b>{g.count}</b></div>):<p className="chart-empty">Upload a resume with recognizable skills to see category distribution.</p>}</article>
      <article className="visual-card roadmap-card"><h4>Resume improvement workflow</h4><div className="roadmap"><div><span>1</span><b>Structure</b><small>Complete key sections</small></div><i/><div><span>2</span><b>Evidence</b><small>Show projects & outcomes</small></div><i/><div><span>3</span><b>Tailor</b><small>Align to target role</small></div><i/><div><span>4</span><b>Polish</b><small>Proofread & simplify</small></div></div></article>
      {comparison&&<article className="visual-card comparison-chart"><h4>Job skill overlap</h4><div className="overlap-track"><i style={{width:`${comparison.jobSkills.length?comparison.matched.length/comparison.jobSkills.length*100:0}%`}}/></div><div className="overlap-legend"><span><i className="legend-found"/> Matched: <b>{comparison.matched.length}</b></span><span><i className="legend-review"/> Not detected: <b>{comparison.missing.length}</b></span></div></article>}
    </div>
  </section>;
}

function Comparison({result,title,company,onDownload}) {
  return <div className="comparison-results"><div className="match-overview"><div className="match-ring" style={{'--score':`${result.score}%`}}><div><b>{result.score}%</b><small>MATCH</small></div></div><div><span className="eyebrow">{title||'JOB DESCRIPTION'} {company?`· ${company}`:''}</span><h3>{result.score>=75?'Good overlap with this role':result.score>=50?'Some relevant overlap':'Significant gaps to review'}</h3><p>{result.matched.length} of {result.jobSkills.length} detected job skills also appear in your resume. {result.score}% is a keyword-based comparison, not a hiring prediction.</p></div><button className="btn-secondary download-btn" onClick={onDownload}><Download size={15}/> Report</button></div>
    <div className="match-columns"><div><h4><Check size={16}/> Matched skills <span>{result.matched.length}</span></h4>{result.matched.length?<div className="match-chips">{result.matched.map(s=><span className="match-chip" key={s}>{titleCase(s)}</span>)}</div>:<p className="muted">No direct skill matches found.</p>}</div><div><h4><Target size={16}/> Skills not detected <span>{result.missing.length}</span></h4>{result.missing.length?<div className="match-chips">{result.missing.map(s=><span className="missing-chip" key={s}>{titleCase(s)}</span>)}</div>:<p className="muted">All detected job skills appear in your resume.</p>}</div></div>
    <div className="recommendations"><h4><Sparkles size={16}/> Suggested next steps</h4>{result.recommendations.map((r,i)=><p key={i}><ArrowUpRight size={15}/>{r}</p>)}</div>
    <div className="score-disclaimer"><CircleHelp size={15}/> Score formula uses detected skill overlap and frequent job-description keywords. It does not assess seniority, context, quality of experience or actual hiring decisions.</div>
  </div>;
}

export default App;
