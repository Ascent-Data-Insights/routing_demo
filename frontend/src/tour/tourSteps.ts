import { createElement } from 'react'
import type { Step } from 'react-joyride'

const ctaContent = createElement('div', null,
    createElement('p', null, "Interested in applying route optimization to your business? We'd love to chat about how this can be tailored to your specific needs."),
    createElement('a', {
        href: 'https://ascentdi.com/contact',
        target: '_blank',
        rel: 'noopener noreferrer',
        style: {
            display: 'inline-block',
            marginTop: 12,
            padding: '8px 20px',
            backgroundColor: '#FB8500',
            color: 'white',
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
        },
    }, 'Get in Touch'),
)

export interface TourStep extends Step {
    data?: {
        requiredTab?: 'panel' | 'map'
        closePanel?: boolean
    }
}

export const desktopSteps: TourStep[] = [
    {
        target: '[data-tour="header"]',
        content: "Welcome to the Routing Optimization Demo! See how quickly we can optimize delivery truck routes across multiple warehouses and destinations.",
        placement: 'center',
        disableBeacon: true,
    },
    {
        target: '[data-tour="config-panel"]',
        content: 'This is the Configuration panel. Use the controls here to set up your routing scenario.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="location-sliders"]',
        content: 'Adjust the number of source warehouses and destination stops. The map updates in real time.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="container-section"]',
        content:
            'Configure how many ambient and refrigerated containers need to be delivered. Each block represents a container assigned to a source and destination.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="truck-capacity"]',
        content: 'Set the capacity of each truck. Trucks have separate slots for ambient and refrigerated containers.',
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="run-button"]',
        content: "Click Run Optimization androutes are computed in seconds, even with dozens of containers and destinations.",
        placement: 'top',
        disableBeacon: true,
    },
    {
        target: '[data-tour="map-area"]',
        content: "The map displays your optimized routes in real time. This demo uses a baseline algorithm, which can be customized further with additional constraints like time windows, driver schedules, or vehicle types.",
        placement: 'center',
        disableBeacon: true,
        data: { closePanel: true },
    },
    {
        target: '[data-tour="header"]',
        content: ctaContent,
        placement: 'center',
        disableBeacon: true,
        data: { closePanel: true },
    },
]

export const mobileSteps: TourStep[] = [
    {
        target: '[data-tour="mobile-tab-bar"]',
        content: 'Switch between the configuration panel and the map using these tabs.',
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
    {
        target: '[data-tour="mobile-location-sliders"]',
        content: 'Set the number of source warehouses and delivery destinations.',
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
    {
        target: '[data-tour="mobile-container-section"]',
        content: 'Configure ambient and refrigerated container counts.',
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
    {
        target: '[data-tour="mobile-truck-capacity"]',
        content: 'Set how much each truck can carry with separate slots for ambient and refrigerated.',
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
    {
        target: '[data-tour="mobile-run-button"]',
        content: 'Tap Run Optimization and routes are computed in seconds, even with many containers and destinations.',
        placement: 'top',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
    {
        target: '[data-tour="map-area"]',
        content: 'Your optimized routes appear here. This demo uses a baseline algorithm that can be customized with additional constraints for your specific use case.',
        placement: 'center',
        disableBeacon: true,
        data: { requiredTab: 'map' },
    },
    {
        target: '[data-tour="mobile-tab-bar"]',
        content: ctaContent,
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
]

export const desktopResultsSteps: TourStep[] = [
    {
        target: '[data-tour="icon-rail"]',
        content: 'Use these icons to switch between the Configuration and Results panels.',
        placement: 'right',
        disableBeacon: true,
        data: { closePanel: true },
    },
    {
        target: '[data-tour="results-panel"]',
        content: "Here are your optimization results! Compare the basic nearest-neighbor approach against the optimized solution to see the distance savings.",
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="results-toggle"]',
        content: "Toggle between solutions to compare. The optimized route minimizes total drive distance across all trucks.",
        placement: 'right',
        disableBeacon: true,
    },
    {
        target: '[data-tour="results-truck-list"]',
        content: "Click any truck card to highlight its route on the map and see which containers it carries.",
        placement: 'right',
        disableBeacon: true,
    },
]

export const mobileResultsSteps: TourStep[] = [
    {
        target: '[data-tour="results-panel"]',
        content: "Here are your results! Toggle between the basic and optimized solutions to compare distance savings.",
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
    {
        target: '[data-tour="results-truck-list"]',
        content: "Tap any truck to highlight its route on the map.",
        placement: 'bottom',
        disableBeacon: true,
        data: { requiredTab: 'panel' },
    },
]
