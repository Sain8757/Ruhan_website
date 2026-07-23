"use client";

import React, { useState } from 'react';
import './legacy.css';
import { Check, X, File, FilePlus, ArrowUpCircle, MousePointer2, Settings, FileText, Phone, Pause, Calculator, CircleX } from 'lucide-react';

export default function LegacyUI() {
  const [showPolicyModal, setShowPolicyModal] = useState(true);
  const [showTerrorismModal, setShowTerrorismModal] = useState(true);

  return (
    <div className="legacy-desktop">
      {/* Background Main Application Window */}
      <div 
        className="legacy-window"
        style={{ 
          top: '5%', left: '5%', right: '5%', bottom: '5%',
          minWidth: '800px', minHeight: '600px'
        }}
      >
        {/* Title Bar */}
        <div className="legacy-window-titlebar">
          <div className="title-text">
            <span style={{ fontSize: '14px', lineHeight: 1 }}>🔹</span>
            Agency Information Manager - Papell Law Firm Inc.
          </div>
          <div className="legacy-window-controls">
            <button className="legacy-btn-sys">_</button>
            <button className="legacy-btn-sys">□</button>
            <button className="legacy-btn-close"><X size={10} /></button>
          </div>
        </div>

        {/* Menu Bar */}
        <div style={{ background: '#d4d0c8', padding: '2px 4px', display: 'flex', gap: '8px', borderBottom: '1px solid #808080' }}>
          <span><u style={{ textDecoration: 'none', borderBottom: '1px solid black' }}>F</u>ile</span>
          <span><u style={{ textDecoration: 'none', borderBottom: '1px solid black' }}>E</u>dit</span>
          <span>Module</span>
          <span>Tools</span>
          <span>Brokerage</span>
          <span>Submission</span>
          <span>Policy</span>
          <span>ImageRight</span>
          <span>Detail</span>
          <span>Custom</span>
          <span>Help</span>
        </div>

        {/* Toolbar */}
        <div className="legacy-toolbar">
          <button className="legacy-toolbar-btn">
            <FilePlus size={16} color="#008080" />
            New
          </button>
          <button className="legacy-toolbar-btn">
            <File size={16} color="#000080" />
            View D...
          </button>
          <button className="legacy-toolbar-btn">
            <ArrowUpCircle size={16} color="#008080" />
            Submit
          </button>
          <button className="legacy-toolbar-btn">
            <MousePointer2 size={16} color="#000080" />
            Quote
          </button>
          <button className="legacy-toolbar-btn">
            <FileText size={16} color="#000080" />
            Bind
          </button>
          <button className="legacy-toolbar-btn">
            <Settings size={16} color="#008080" />
            Mkt Wiz
          </button>
          <button className="legacy-toolbar-btn">
            <FileText size={16} color="#008080" />
            Memo
          </button>
          <button className="legacy-toolbar-btn">
            <Phone size={16} color="#008080" />
            PhoneBk
          </button>
          <button className="legacy-toolbar-btn">
            <Pause size={16} color="#008080" />
            Suspe
          </button>
        </div>

        {/* Content Area */}
        <div style={{ padding: '4px', background: '#d4d0c8', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header Row */}
          <div style={{ background: '#0a246a', color: 'white', padding: '4px 8px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>G74283986 002(Renewal)</span>
            <span>Papell Law Firm Inc.</span>
          </div>

          {/* Tabs */}
          <div className="legacy-tabs-container">
            <div className="legacy-tab">Main</div>
            <div className="legacy-tab active">Detail</div>
            <div className="legacy-tab">Coverages</div>
            <div className="legacy-tab">Activity</div>
            <div className="legacy-tab">Notes</div>
            <div className="legacy-tab">Policy Data</div>
            <div className="legacy-tab">Accounting</div>
          </div>

          {/* Tab Content */}
          <div className="legacy-tab-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
              <span>Search For:</span>
              <input type="text" className="legacy-input" style={{ width: '150px' }} defaultValue="%Ta..." />
            </div>

            {/* Datagrid representing Premium Distribution */}
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <div style={{ width: '200px', border: '1px solid #808080' }}>
                 {/* Left pane tree view placeholder */}
                 <div style={{ background: '#0a246a', color: 'white', padding: '2px 4px' }}>NamedInsured</div>
                 <div style={{ padding: '2px 4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '12px', height: '12px', background: 'yellow', border: '1px solid #808080' }}></div>
                    Papell Law Firm Inc
                 </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 
                 {/* Inner fieldset/panel */}
                 <fieldset className="legacy-fieldset">
                   <legend>Premium Distribution</legend>
                   <div style={{ padding: '4px' }}>
                     <div style={{ fontWeight: 'bold', color: '#000080', marginBottom: '4px' }}>Line Of Business/Package Distribution</div>
                     
                     <table className="legacy-grid">
                       <thead>
                         <tr>
                           <th>Line of Business (LOB)</th>
                           <th>Premium</th>
                           <th>Gross%</th>
                           <th>Agent%</th>
                           <th>MEP</th>
                         </tr>
                       </thead>
                       <tbody>
                         <tr className="selected">
                           <td>Cyber E&O</td>
                           <td>$2,276.00</td>
                           <td style={{ background: 'yellow' }}>25.000</td>
                           <td style={{ background: 'yellow' }}>12.000</td>
                           <td></td>
                         </tr>
                         <tr>
                           <td>Employment Practices Liability</td>
                           <td>$4,988.00</td>
                           <td style={{ background: 'yellow' }}>21.000</td>
                           <td style={{ background: 'yellow' }}>12.000</td>
                           <td></td>
                         </tr>
                         <tr>
                           <td></td>
                           <td>$0.00</td>
                           <td>0.000</td>
                           <td>0.000</td>
                           <td></td>
                         </tr>
                       </tbody>
                     </table>
                     
                     <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                        <button className="legacy-button">Copy Defaults</button>
                        <button className="legacy-button">Copy Comm%</button>
                        <input className="legacy-input" style={{ width: '80px', fontWeight: 'bold', textAlign: 'right', background: '#d4d0c8' }} disabled value="$7,264.00" />
                     </div>
                   </div>
                 </fieldset>

              </div>
            </div>
            
          </div>
        </div>
      </div>


      {/* Modal 1: Enter Policy Number */}
      {showPolicyModal && (
        <div 
          className="legacy-window" 
          style={{ 
            width: '450px', 
            position: 'absolute', 
            top: '20%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 100
          }}
        >
          <div className="legacy-window-titlebar">
            <div className="title-text">
              <span style={{ fontSize: '14px', lineHeight: 1, color: 'blue' }}>◐</span>
              Enter Policy Number
            </div>
            <div className="legacy-window-controls">
              <button className="legacy-btn-sys">_</button>
              <button className="legacy-btn-sys">□</button>
              <button className="legacy-btn-close" onClick={() => setShowPolicyModal(false)}><X size={10} /></button>
            </div>
          </div>
          
          <div className="legacy-content">
            <p style={{ margin: '0 0 12px 0' }}>Enter the policy number to be assigned to this binder. Enter the policy number with a &quot;-&quot; between the prefix and policy number (ie. no spaces)</p>
            
            <fieldset className="legacy-fieldset" style={{ paddingBottom: '16px' }}>
              <legend>Assigned Policy</legend>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ minWidth: '50px' }}>Policy #</span>
                <input type="text" className="legacy-input" style={{ flex: 1, background: 'yellow' }} defaultValue="G74283986 003" />
                
                <span style={{ marginLeft: '16px' }}>Ver #</span>
                <input type="text" className="legacy-input small" />
              </div>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
              <button className="legacy-button" onClick={() => setShowPolicyModal(false)}>
                <Check size={14} color="green" /> OK
              </button>
              <button className="legacy-button" onClick={() => setShowPolicyModal(false)}>
                <X size={14} color="red" /> Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal 2: Terrorism Act Premium Endorsement */}
      {showTerrorismModal && (
        <div 
          className="legacy-window" 
          style={{ 
            width: '450px', 
            position: 'absolute', 
            top: '55%', 
            left: '50%', 
            transform: 'translateX(-50%)',
            zIndex: 101
          }}
        >
          <div className="legacy-window-titlebar">
            <div className="title-text">
              <span style={{ fontSize: '14px', lineHeight: 1, color: 'blue' }}>◐</span>
              Terrorism Act Premium Endorsement
            </div>
            <div className="legacy-window-controls">
              <button className="legacy-btn-sys">_</button>
              <button className="legacy-btn-sys">□</button>
              <button className="legacy-btn-close" onClick={() => setShowTerrorismModal(false)}><X size={10} /></button>
            </div>
          </div>
          
          <div className="legacy-content">
            
            <fieldset className="legacy-fieldset" style={{ paddingBottom: '12px', marginBottom: '12px' }}>
              <legend>Terrorism Act Coverage</legend>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <select className="legacy-select" style={{ flex: 1 }}>
                  <option>APPLIES</option>
                  <option>DOES NOT APPLY</option>
                </select>
                
                <label style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" className="legacy-checkbox" defaultChecked />
                  Manual Calculation
                </label>
              </div>
            </fieldset>

            <fieldset className="legacy-fieldset" style={{ paddingBottom: '12px' }}>
              <legend>Terrorism Act Premium - TOTAL</legend>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>Premium (TOTAL)</span>
                  <input type="text" className="legacy-input" style={{ width: '120px', textAlign: 'right' }} defaultValue="$123.00" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>Gross%</span>
                  <input type="text" className="legacy-input small" defaultValue="999" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>Agent%</span>
                  <input type="text" className="legacy-input small" defaultValue="999" />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: 'bold' }}>MEP</span>
                  <input type="text" className="legacy-input small" />
                </div>
              </div>
              
              <div style={{ marginTop: '12px', color: '#000', fontSize: '10px' }}>
                ( Enter 999 for Commission % if the Commission from the Policy applies )
              </div>
            </fieldset>

            <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '8px', marginTop: '12px' }}>
              <button className="legacy-button" onClick={() => setShowTerrorismModal(false)}>
                <Check size={14} color="green" /> OK
              </button>
              <button className="legacy-button" onClick={() => {
                  // handle clear
              }}>
                <CircleX size={14} color="red" /> Clear
              </button>
              <button className="legacy-button" style={{ marginLeft: 'auto' }}>
                <Calculator size={14} /> Calculate
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
