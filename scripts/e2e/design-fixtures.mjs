// Synthetic records for local visual QA. Never forwards a request to a real API.
export const PREVIEW_ROLES=["ROLE_EMPLOYEE","ROLE_MANAGER","ROLE_HR","ROLE_ADMIN"];
export const PREVIEW_USER={email:"qa@webknot.in",name:"Alex Morgan",emp_id:"PREVIEW-001",status:"ACTIVE",user_type:"FULLTIME",roles:PREVIEW_ROLES,department:"Engineering",role:"Software Engineer",band:"B2",is_manager:true,personal_email:"preview@example.com",date_of_birth:"01/01/1995",doj:"01/01/2024",primary_skills:["React","TypeScript"],work_mode:"OFFICE",profile_completed:true};
export const PREVIEW_PEOPLE=[PREVIEW_USER,...["Maya Chen","Jordan Lee","Sam Rivera","Taylor Brooks","Avery Patel","Riley Adams","Casey Park","Morgan Reed","Jamie Ellis","Quinn Shah","Drew Wilson","Skyler Moore"].map((name,i)=>({...PREVIEW_USER,name,email:`person${i+1}@example.com`,emp_id:`PREVIEW-${String(i+2).padStart(3,"0")}`,is_manager:false,roles:["ROLE_EMPLOYEE"],department:i%3===0?"Design":"Engineering",role:i%3===0?"Product Designer":"Software Engineer",status:i===11?"SERVING_NOTICE":"ACTIVE"}))];
export const PREVIEW_PROJECTS=[
  {project_code:"PRJ-001",project_name:"Customer experience platform",client_name:"Northstar",project_type:"BILLABLE",start_date:"01/09/2026",end_date:"31/03/2027",opportunity_ids:[]},
  {project_code:"PRJ-002",project_name:"Digital operations hub",client_name:"Acme Studio",project_type:"BILLABLE",start_date:"15/08/2026",end_date:"31/12/2026",opportunity_ids:[]},
  {project_code:"PRJ-003",project_name:"Design system foundations",client_name:"WebKnot",project_type:"INTERNAL",start_date:"01/10/2026",end_date:"30/01/2027",opportunity_ids:[]},
  {project_code:"PRJ-004",project_name:"Partner onboarding",client_name:"Northstar",project_type:"BILLABLE",start_date:"01/07/2026",end_date:"30/09/2026",opportunity_ids:[]},
];
export function designFixture(path,url){
  if(path==="/profile")return PREVIEW_USER;
  if(path==="/roles")return {roles:PREVIEW_ROLES};
  if(path==="/auth/me")return {...PREVIEW_USER,message:"ok",session_inactivity_minutes:240};
  if(path==="/user/onboard"||path==="/user/invited")return {content:PREVIEW_PEOPLE,totalElements:PREVIEW_PEOPLE.length,totalPages:1,number:0,size:100};
  if(path==="/projects"||path==="/projects/all")return PREVIEW_PROJECTS;
  if(path==="/masters/onboard-options")return {departments:["Engineering","Design","People & Culture"],bands:[{id:2,name:"B2"}],user_types:["FULLTIME","INTERN","CONSULTANT"],statuses:["ACTIVE","SERVING_NOTICE"],designations:["Software Engineer","Product Designer"]};
  if(path==="/attendance-today")return {date:"2026-10-22",total_active:13,office:{count:9,employees:PREVIEW_PEOPLE.slice(0,9)},work_from_home:{count:2,employees:PREVIEW_PEOPLE.slice(9,11)},on_leave:{count:2,employees:PREVIEW_PEOPLE.slice(11)}};
  if(path==="/trainings/my-learning-summary")return {enrolled_count:3,in_progress_count:1,completed_count:2,overdue_mandatory_count:0};
  if(path==="/settings/seasonal-theme")return {enabled:false,active_theme:null};
  if(path==="/settings/seasonal-theme/admin")return {enabled:false,themes:[],available_themes:[]};
  if(path==="/notifications")return [];
  if(path==="/compliance/nudges")return {items:[],total:0};
  if(path==="/whos-out")return {days:[],employees:[],items:[]};
  if(path==="/assets/my")return [];
  if(path.startsWith("/employee-profile/"))return PREVIEW_PEOPLE.find(p=>path.endsWith(p.emp_id))??PREVIEW_USER;
  return undefined;
}
