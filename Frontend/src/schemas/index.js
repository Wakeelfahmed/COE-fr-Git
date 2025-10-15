// src/schemas/index.js

export const projectSchema = {
    projectTitle: String,
    supervisor: String,
    rndTeam: String,
    date: Date,
  };
  
  export const trainingSchema = {
    trainingTitle: String,
    instructor: String,
    startDate: Date,
    endDate: Date,
    participants: Number,
  };
  
  export const internshipSchema = {
    internshipTitle: String,
    company: String,
    startDate: Date,
    endDate: Date,
    supervisor: String,
  };
  
  export const eventSchema = {
    eventName: String,
    date: Date,
    location: String,
    organizer: String,
    attendees: Number,
  };
  
  export const patentSchema = {
    patentTitle: String,
    inventors: String,
    filingDate: Date,
    patentNumber: String,
    status: String,
  };
  
  export const fundingSchema = {
    projectTitle: String,
    fundingAgency: String,
    amount: Number,
    startDate: Date,
    endDate: Date,
  };
  
  export const publicationSchema = {
    title: String,
    authors: String,
    journal: String,
    publicationDate: Date,
    doi: String,
  };
  
  export const formSchema = {
    formName: String,
    category: String,
    lastUpdated: Date,
    downloadLink: String,
  };
  
  export const reportSchema = {
    reportTitle: String,
    author: String,
    date: Date,
    category: String,
    downloadLink: String,
  };