import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useCreateStudyGroup } from '../../hooks/useStudyGroups';
import { useUserSearch } from '../../hooks/useUserProfile';
import type {
  CreateStudyGroupPayload,
  StudyGroupVisibility,
  UserSearchResult,
} from '../../api/types';

interface CreateStudyGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  pathId: number;
  onCreated?: (groupId: number) => void;
}

const visibilityOptions: { label: string; value: StudyGroupVisibility; description: string }[] = [
  {
    label: 'Public',
    value: 'public',
    description: 'Anyone can discover and join this study group.',
  },
  {
    label: 'Restricted',
    value: 'restricted',
    description: 'Visible to everyone, but join requests require approval.',
  },
  {
    label: 'Private',
    value: 'private',
    description: 'Only invited members can find and join.',
  },
];

const CreateStudyGroupDialog = ({ isOpen, onClose, pathId, onCreated }: CreateStudyGroupDialogProps) => {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<StudyGroupVisibility>('restricted');
  const [meetingDay, setMeetingDay] = useState('Wednesday');
  const [meetingTime, setMeetingTime] = useState('18:00 UTC');
  const [allowRecording, setAllowRecording] = useState(true);
  const [selectedMembers, setSelectedMembers] = useState<UserSearchResult[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);

  const {
    mutate: createStudyGroupMutate,
    isPending: isSubmitting,
    reset: resetCreateStudyGroup,
  } = useCreateStudyGroup(pathId);
  const {
    mutate: searchUsers,
    isPending: isSearching,
    reset: resetUserSearch,
  } = useUserSearch();

  const resetForm = () => {
    setGroupName('');
    setDescription('');
    setVisibility('restricted');
    setMeetingDay('Wednesday');
    setMeetingTime('18:00 UTC');
    setAllowRecording(true);
    setSelectedMembers([]);
    setSearchTerm('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (!isOpen) {
      resetForm();
      resetUserSearch();
      resetCreateStudyGroup();
    }
  }, [isOpen, resetUserSearch, resetCreateStudyGroup]);

  const handleMemberSelect = (member: UserSearchResult) => {
    if (selectedMembers.some(existing => existing.userId === member.userId)) {
      toast.info(`${member.userName} is already added.`);
      return;
    }
    setSelectedMembers(prev => [...prev, member]);
  };

  const handleMemberRemove = (userId: number) => {
    setSelectedMembers(prev => prev.filter(member => member.userId !== userId));
  };

  const handleSearch = () => {
    const term = searchTerm.trim();
    if (!term) {
      toast.info('Enter a name or email to search.');
      return;
    }

    searchUsers(term, {
      onSuccess: data => {
        setSearchResults(data.results);
        if (data.results.length === 0) {
          toast.info('No matching users found.');
        }
      },
      onError: error => {
        const message = error?.response?.message || error?.message || 'Failed to search users.';
        toast.error(message);
      },
    });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!groupName.trim()) {
      toast.info('Please provide a group name.');
      return;
    }

    if (!description.trim()) {
      toast.info('Please add a short description.');
      return;
    }

    const payload: CreateStudyGroupPayload = {
      groupName: groupName.trim(),
      description: description.trim(),
      visibility,
      settings: {
        meetingDay,
        meetingTime: meetingTime.trim() || '18:00 UTC',
        allowRecording,
      },
      initialMembers: selectedMembers.length > 0 ? selectedMembers.map(member => member.userId) : undefined,
    };

    createStudyGroupMutate(payload, {
      onSuccess: response => {
        toast.success('Study group created successfully.');
        resetForm();
        onClose();
        if (response.group?.groupId && onCreated) {
          onCreated(response.group.groupId);
        }
      },
      onError: error => {
        const message = error?.response?.message || error?.message || 'Failed to create study group.';
        toast.error(message);
      },
    });
  };

  const availableResults = useMemo(() => {
    if (selectedMembers.length === 0) return searchResults;
    const selectedIds = new Set(selectedMembers.map(member => member.userId));
    return searchResults.filter(member => !selectedIds.has(member.userId));
  }, [searchResults, selectedMembers]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-3xl bg-[#1E1E1E] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Study Group</h2>
            <p className="text-gray-400 text-sm">Bring learners together and collaborate on this learning path.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Group Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={event => setGroupName(event.target.value)}
                  placeholder="e.g. Web3 Builders Cohort"
                  className="w-full bg-[#242424] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all"
                />
              </div>

              <div>
                <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Description</label>
                <textarea
                  value={description}
                  onChange={event => setDescription(event.target.value)}
                  placeholder="Describe the purpose and expectations for this study group."
                  rows={4}
                  className="w-full bg-[#242424] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all resize-none"
                />
              </div>

              <div>
                <span className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Visibility</span>
                <div className="space-y-2">
                  {visibilityOptions.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setVisibility(option.value)}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 ${
                        visibility === option.value
                          ? 'border-[#7FDBCA] bg-[#7FDBCA]/10 text-white'
                          : 'border-gray-800 text-gray-300 hover:border-[#7FDBCA]/40 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{option.label}</span>
                        {visibility === option.value && (
                          <svg className="w-4 h-4 text-[#7FDBCA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Meeting Day</label>
                  <select
                    value={meetingDay}
                    onChange={event => setMeetingDay(event.target.value)}
                    className="w-full bg-[#242424] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all"
                  >
                    {meetingDays.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs uppercase text-gray-500 font-semibold mb-2 block">Meeting Time</label>
                  <input
                    type="text"
                    value={meetingTime}
                    onChange={event => setMeetingTime(event.target.value)}
                    placeholder="18:00 UTC"
                    className="w-full bg-[#242424] border border-gray-800 rounded-xl px-4 py-3 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all"
                  />
                </div>
              </div> */}

              {/* <div className="flex items-center justify-between px-4 py-3 bg-[#242424] border border-gray-800 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-white">Allow session recordings</p>
                  <p className="text-xs text-gray-400">Participants can catch up if they miss a meeting.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowRecording(prev => !prev)}
                  className={`w-12 h-6 flex items-center rounded-full transition-all duration-200 ${
                    allowRecording ? 'bg-[#7FDBCA]/80' : 'bg-gray-700'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full bg-white transform transition-transform duration-200 ${
                      allowRecording ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div> */}

              <div className="space-y-3">
                <div className="flex flex-col items-center justify-between gap-2 pb-1">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Invite Members</h3>
                    <p className="text-xs text-gray-400">Search for teammates to add them right away.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={event => setSearchTerm(event.target.value)}
                      placeholder="Search by name or email"
                      className="w-48 bg-[#242424] border border-gray-800 rounded-xl px-3 py-2 text-gray-100 focus:border-[#7FDBCA] focus:ring-2 focus:ring-[#7FDBCA]/40 transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSearch}
                      disabled={isSearching}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isSearching
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : 'bg-gray-800 text-gray-200 hover:text-white hover:border-[#7FDBCA]/40 border border-gray-700'
                      }`}
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </button>
                  </div>
                </div>

                {availableResults.length > 0 && (
                  <div className="bg-[#242424] border border-gray-800 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                    {availableResults.map(result => (
                      <button
                        key={result.userId}
                        type="button"
                        onClick={() => handleMemberSelect(result)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-200 hover:bg-[#7FDBCA]/10 hover:text-white transition-colors"
                      >
                        <span>{result.userName}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMembers.length > 0 && (
                  <div className="bg-[#242424] border border-gray-800 rounded-xl p-3 space-y-2 max-h-40 overflow-y-auto">
                    <h4 className="text-xs uppercase text-gray-500 font-semibold">Initial Members</h4>
                    {selectedMembers.map(member => (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-200 bg-gray-800/60 border border-gray-700"
                      >
                        <span>{member.userName}</span>
                        <button
                          type="button"
                          onClick={() => handleMemberRemove(member.userId)}
                          className="p-1 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isSubmitting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-[#7FDBCA] to-[#00CC99] text-[#0B1F1A] shadow-lg shadow-[#7FDBCA]/20 hover:shadow-xl'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create Study Group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateStudyGroupDialog;
