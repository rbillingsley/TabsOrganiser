chrome.tabs.onCreated.addListener(blockDuplicateTabs);

async function blockDuplicateTabs(createdTab) {
    const createdTabUrl = createdTab.pendingUrl;
    const createdTabId = createdTab.id; 
    const currentTabsQueryOption = { active: false, lastFocusedWindow: true};
    const currentTabs = await chrome.tabs.query(currentTabsQueryOption);

    console.log("Tab created:", createdTab)
    console.log("Tabs:", currentTabs)

    const existingTabIndices = currentTabs.filter(
        findDuplicateTabs(createdTabUrl))
        .map((tab) =>  tab.index)
        .reverse();

    console.log("Existing Tabs:", existingTabIndices)

    if (existingTabIndices.length > 0)
    {
        // close the new tab as we already have one open
        await chrome.tabs.remove(createdTabId);
        console.log("Removed Tab:", createdTabId, createdTab)

        const tabsToHighlight= {
            tabs: existingTabIndices
        };

        console.log("Tabs to highlight:", tabsToHighlight);

        // highlight and focus the existing tab(s)
        await chrome.tabs.highlight(tabsToHighlight);
    }
}

function findDuplicateTabs(createdTabUrl) {
    return (tab) => {
        let currentTabUrl = tab.url;
        console.log(createdTabUrl, "===", currentTabUrl);
        return createdTabUrl === tab.url;
    };
}
