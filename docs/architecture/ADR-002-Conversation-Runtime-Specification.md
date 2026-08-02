# ADR-002: Conversation Runtime Specification

## Status
SPECIFICATION APPROVED. This is a logical Contract only. It creates no runtime implementation or production integration.

## Purpose
Define a bounded, user-directed Conversation Runtime that can understand questions, clarify, explain, reason, plan, review, format, and present a read-only result without owning general command execution.

## Consistency
ADR-001 recommends logical extraction. Program 4 remains frozen with a CLOSED execution gate. The Evidence Baseline establishes that existing History may persist and that the present CommandApi flow remains authoritative.