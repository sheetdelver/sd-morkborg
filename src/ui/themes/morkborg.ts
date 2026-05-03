export const morkborgTheme = {
    chat: {
        container: "bg-[#ffe900] border-2 border-black shadow-[4px_4px_0_0_#000] rounded-none",
        header: "text-black text-sm font-bold uppercase mb-4 border-b-2 border-black pb-2 font-serif tracking-widest",
        msgContainer: (isRoll: boolean) => `p-0 border-2 border-black mb-1 shadow-sm ${isRoll ? 'bg-black text-white' : 'bg-white text-black'}`,
        user: "font-serif font-bold text-xs uppercase tracking-wider px-2 pt-1 block",
        time: "text-[9px] uppercase font-bold text-neutral-400 tracking-widest px-2 block",
        flavor: "text-xs italic text-neutral-600 mb-0.5 font-serif leading-tight px-2 block",
        content: `
            text-sm font-serif leading-relaxed messages-content 
            [&_.roll-card]:border-0 [&_.roll-card]:bg-black [&_.roll-card]:text-white
            [&_.card-title]:bg-[#ffe900] [&_.card-title]:text-black [&_.card-title]:font-bold [&_.card-title]:uppercase [&_.card-title]:text-center [&_.card-title]:py-1 [&_.card-title]:mb-2 [&_.card-title]:font-serif [&_.card-title]:tracking-widest
            [&_.item-row]:flex [&_.item-row]:items-center [&_.item-row]:justify-center [&_.item-row]:gap-2 [&_.item-row]:px-2 [&_.item-row]:mb-2
            [&_.chat-card-image]:border [&_.chat-card-image]:border-white/20 [&_.chat-card-image]:flex-shrink-0
            [&_.item-name]:font-bold [&_.item-name]:text-lg [&_.item-name]:font-serif [&_.item-name]:brightness-125
            [&_.roll-result]:mb-3 [&_.roll-result]:px-2
            [&_.roll-title]:text-[10px] [&_.roll-title]:uppercase [&_.roll-title]:text-white/60 [&_.roll-title]:font-mono [&_.roll-title]:font-bold
            [&_.roll-row]:border [&_.roll-row]:border-white/20 [&_.roll-row]:py-1 [&_.roll-row]:text-center [&_.roll-row]:bg-white/5
            [&_.roll-row_span]:text-xl [&_.roll-row_span]:font-bold [&_.roll-row_span]:font-serif
            [&_.outcome-row]:bg-[#ffe900] [&_.outcome-row]:text-black [&_.outcome-row]:font-bold [&_.outcome-row]:text-center [&_.outcome-row]:py-2 [&_.outcome-row]:my-1 [&_.outcome-row]:font-serif [&_.outcome-row]:text-lg [&_.outcome-row]:uppercase [&_.outcome-row]:tracking-tight
            [&_.outcome-row_span]:px-2
        `,
        rollResult: "hidden", // We use the custom card structure instead
        rollFormula: "hidden",
        rollTotal: "hidden",
        button: "inline-flex items-center gap-1 bg-white hover:bg-black group border-2 border-black px-2 py-0.5 text-xs font-bold text-black hover:text-white transition-colors cursor-pointer my-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-[2px] rounded-lg",
        buttonText: "uppercase font-sans tracking-widest",
        buttonValue: "font-serif font-bold group-hover:text-white",
        scrollButton: "bg-white hover:bg-black border-2 border-black px-3 py-1.5 text-xs font-bold text-black hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-[2px] uppercase tracking-widest",
        inputContainer: "col-span-2 flex gap-2 p-1 bg-neutral-50 border-t-2 border-black mt-2",
        inputField: "flex-1 bg-white border-2 border-black rounded-none px-3 py-1.5 text-sm font-serif focus:outline-none focus:bg-neutral-50 text-black placeholder:text-neutral-400",
        sendBtn: "bg-black hover:bg-neutral-800 text-white px-4 py-1.5 rounded-none text-xs font-bold font-serif transition-colors uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-none active:translate-y-[2px]"
    },
    diceTray: {
        container: "bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4",
        header: "text-black text-sm font-bold uppercase border-b-2 border-black pb-2 font-serif tracking-widest mb-4",
        textarea: "w-full h-24 bg-white border-2 border-black p-3 font-serif text-lg text-black focus:bg-neutral-50 outline-none resize-none",
        clearBtn: "absolute top-2 right-2 text-xs text-neutral-400 hover:text-red-600 uppercase font-bold font-serif",
        diceRow: "flex flex-wrap justify-between gap-2 bg-neutral-50 p-2 border-2 border-black mb-4",
        diceBtn: "w-10 h-10 flex items-center justify-center bg-white hover:bg-black hover:text-white active:bg-neutral-200 border-2 border-black rounded-lg shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] text-xs font-bold font-serif transition-all text-black",
        modGroup: "flex gap-1",
        modBtn: "px-3 py-2 bg-white border-2 border-black rounded-lg hover:bg-black hover:text-white font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all font-serif text-black hover:text-white",
        rollModeGroup: "flex gap-1 mb-2",
        rollModeBtn: (active: boolean) => `flex-1 flex items-center justify-center p-2 border-2 border-black transition-all ${active ? 'bg-black text-white shadow-none translate-y-[1px]' : 'bg-white text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-neutral-50'}`,
        advGroup: "flex bg-neutral-50 border-2 border-black p-1",
        advBtn: (active: boolean, type: 'normal' | 'adv' | 'dis') => {
            const base = "px-2 py-1 text-xs font-bold transition-all font-serif ";
            if (!active) return base + "text-neutral-500 hover:text-black";
            if (type === 'normal') return base + "bg-black text-white";
            if (type === 'adv') return base + "bg-green-600 text-white";
            return base + "bg-red-600 text-white";
        },
        sendBtn: "flex-1 bg-black hover:bg-neutral-800 text-white font-bold uppercase tracking-widest py-3 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-[2px] transition-all text-xl font-serif",
        helpText: "text-[10px] text-neutral-400 text-center mt-2 uppercase tracking-widest font-bold"
    },
    modal: {
        overlay: "absolute inset-0 bg-black/60 backdrop-blur-sm",
        container: "relative z-10 bg-black border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] w-full max-w-md animate-in fade-in zoom-in-95 duration-200 overflow-hidden",
        header: "bg-black p-4 flex justify-between items-center",
        title: "font-serif font-bold text-xl uppercase tracking-widest text-white",
        body: "bg-white p-6 border-t-[4px] border-black text-neutral-900 font-serif leading-relaxed min-h-[100px]",
        footer: "bg-white p-4 flex justify-end gap-3",
        confirmBtn: (isDanger?: boolean) => `px-6 py-2 font-bold font-serif uppercase tracking-widest text-xs text-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all rounded-none ${isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-black hover:bg-neutral-800'}`,
        cancelBtn: "px-4 py-2 font-bold font-serif uppercase tracking-widest text-xs border-2 border-neutral-300 hover:border-black transition-colors rounded-none text-neutral-600 hover:text-black hover:bg-neutral-50",
        closeBtn: "text-white hover:text-pink-500 transition-colors"
    },
    rollDialog: {
        overlay: "fixed inset-0 bg-black/80 backdrop-blur-sm z-50",
        container: "bg-neutral-950 border-2 border-pink-900 shadow-[8px_8px_0_0_#831843] max-w-sm w-full p-6 relative -rotate-1 text-left inline-block transform transition-all z-[51]",
        header: "mb-4 font-['IM_Fell_Double_Pica']",
        title: "text-2xl text-yellow-400 uppercase tracking-wide mb-1 leading-tight",
        closeBtn: "absolute -top-3 -right-3 text-2xl select-none hover:rotate-12 transition-transform",
        section: "bg-black border border-pink-900/40 p-3 mb-4 font-mono rotate-[0.5deg]",
        label: "text-neutral-500 text-[10px] uppercase tracking-widest mb-1 block",
        input: "w-full bg-neutral-900 border border-neutral-700 text-white px-2 py-1.5 font-mono text-base focus:outline-none focus:border-pink-500",
        select: "w-full bg-neutral-900 border border-neutral-700 text-white px-2 py-1.5 font-mono text-base focus:outline-none focus:border-pink-500 appearance-none",
        buttonGroup: "flex border border-neutral-800",
        buttonActive: "flex-1 py-1.5 text-xs uppercase tracking-widest font-mono transition-all bg-pink-900 text-white",
        buttonInactive: "flex-1 py-1.5 text-xs uppercase tracking-widest font-mono transition-all bg-black text-neutral-500 hover:text-neutral-300",
        confirmBtn: "font-['IM_Fell_Double_Pica'] flex-1 bg-pink-900 hover:bg-pink-700 text-white text-xl py-2 px-4 border border-pink-500 tracking-widest uppercase transition-colors shadow-[4px_4px_0_0_#000] cursor-pointer",
        cancelBtn: "font-['IM_Fell_Double_Pica'] bg-black hover:bg-neutral-900 text-neutral-400 text-xl py-2 px-4 border border-neutral-700 tracking-widest uppercase cursor-pointer",
        formulaResult: "text-white text-lg font-mono",
        formulaBreakdown: "text-neutral-400 text-xs mt-1 font-mono",
        advantageGroup: "flex flex-col gap-2 mt-2",
        advantageBtn: "font-mono text-xs uppercase tracking-widest py-2 px-3 border transition-all text-left flex justify-between items-center cursor-pointer",
        advantageBtnActive: "bg-pink-900 border-pink-500 text-white",
        advantageBtnInactive: "bg-black border-neutral-800 text-neutral-500 hover:border-pink-900 text-neutral-400",
        rollBtn: (mode: 'normal' | 'adv' | 'dis') => {
            const base = "flex-1 py-3 px-4 uppercase font-bold text-sm border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none font-serif tracking-wider rounded-none ";
            if (mode === 'normal') return base + "bg-black text-white hover:bg-neutral-800";
            if (mode === 'adv') return base + "bg-white text-green-700 hover:bg-green-50";
            return base + "bg-white text-red-700 hover:bg-red-50";
        },
    },
    loadingModal: {
        overlay: "absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity",
        container: "relative z-10 p-8 bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] text-center space-y-4 max-w-sm w-full mx-4",
        spinner: "w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto",
        text: "text-xl font-bold text-black font-serif uppercase tracking-widest"
    },
    globalChat: {
        window: "bg-white border-[4px] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
        header: "bg-black border-b-[4px] border-black p-3 flex justify-between items-center",
        title: "text-white font-serif font-bold uppercase tracking-widest text-[12px]",
        diceWindow: "w-[400px]",
        chatWindow: "w-[400px] h-[80vh]",
        toggleBtn: (isOpen: boolean, isDice?: boolean) => {
            const base = "h-14 w-14 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/10 shadow-lg rounded-full ";
            if (isDice) {
                return base + (isOpen ? 'bg-white/10 text-white rotate-90' : 'bg-neutral-900 text-white hover:bg-black');
            }
            return base + (isOpen ? 'bg-white/10 text-white rotate-90' : 'bg-pink-600 text-black hover:bg-pink-500');
        },
        closeBtn: "text-white hover:text-pink-500 transition-colors"
    },
    richText: {
        container: 'relative group flex flex-col bg-black',
        toolbar: {
            container: 'bg-black border-b-2 border-stone-800 p-2 flex flex-wrap gap-1 items-center sticky top-0 z-10 shadow-sm',
            button: 'p-2 rounded hover:bg-neutral-900 transition-colors text-pink-600 hover:text-pink-500',
            buttonActive: 'p-2 rounded bg-neutral-900 transition-colors text-pink-600',
            separator: 'w-px h-6 bg-stone-800 mx-1',
            actionButton: 'px-3 py-1 text-xs font-bold uppercase tracking-widest bg-white text-black hover:bg-neutral-200 rounded mr-2 font-morkborg',
            saveButton: 'px-3 py-1 text-xs font-bold uppercase tracking-widest bg-pink-600 text-white hover:bg-pink-500 rounded flex items-center gap-1 font-morkborg transform -rotate-1 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
        },
        editor: 'prose prose-sm font-serif max-w-none focus:outline-none min-h-[100px] p-4 pb-4 text-neutral-300 selection:bg-pink-600/30 selection:text-white',
        editButton: 'bg-pink-600 text-white px-6 py-2 font-morkborg text-xl uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 transform -rotate-1 hover:rotate-0'
    }
};
